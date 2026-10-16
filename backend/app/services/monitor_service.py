import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from app.models.website import Website
from app.models.snapshot import Snapshot
from app.models.detected_change import DetectedChange
from app.workers.browser_runner import BrowserRunner, BrowserExecutionResult
from app.diff.normalizer import HTMLNormalizer
from app.diff.hash_engine import HashEngine
from app.diff.diff_engine import DiffEngine
from app.storage import get_storage_driver
from app.notifications.dispatcher import NotificationDispatcher
from app.core.logging import logger


class MonitorService:
    """
    Coordinates the entire website change detection pipeline:
    Browser automation -> HTML Normalization -> Noise Filtering -> Hash Comparison ->
    Diff Engine -> Snapshot Persistence -> Notification Dispatch.
    """

    @staticmethod
    async def execute_check(db: AsyncSession, website_id: int) -> Dict[str, Any]:
        """
        Executes an end-to-end monitoring check for a specific website.
        Thread-safe and idempotent.
        """
        # 1. Fetch website and active ignored regions
        result = await db.execute(select(Website).where(Website.id == website_id))
        website = result.scalar_one_or_none()
        if not website:
            raise ValueError(f"Website with id {website_id} not found")

        logger.info(f"Starting check for Website ID={website.id} ('{website.name}') URL={website.url}")

        # Mark status as CHECKING
        website.status = "CHECKING"
        await db.commit()

        # 2. Render page using Playwright
        exec_result: BrowserExecutionResult = await BrowserRunner.capture_page(
            url=website.url,
            take_screenshot=True
        )

        now_utc = datetime.now(timezone.utc)
        website.last_checked_at = now_utc

        if not exec_result.success:
            website.status = "FAILED"
            website.last_status_code = exec_result.http_status or 500
            website.last_error_message = exec_result.error_message or "Failed to render website"
            await db.commit()
            logger.error(f"Check failed for {website.url}: {website.last_error_message}")
            return {
                "status": "failed",
                "website_id": website.id,
                "error": website.last_error_message,
                "response_time_ms": exec_result.response_time_ms
            }

        # 3. HTML Normalization and Noise Filtering
        normalizer = HTMLNormalizer(
            raw_html=exec_result.raw_html,
            ignored_regions=website.ignored_regions
        )
        sanitized_html, normalized_text, page_title = normalizer.clean_html_and_extract_text()
        content_hash = HashEngine.compute_sha256(normalized_text)

        # 4. Fetch the most recent snapshot for baseline comparison
        snapshot_query = await db.execute(
            select(Snapshot)
            .where(Snapshot.website_id == website.id)
            .order_by(desc(Snapshot.created_at))
            .limit(1)
        )
        previous_snapshot = snapshot_query.scalar_one_or_none()

        storage = get_storage_driver()
        unique_token = uuid.uuid4().hex[:12]

        # Scenario A: First check / Baseline establishment
        if not previous_snapshot:
            raw_html_path = await storage.save_file(
                f"websites/{website.id}/snapshots/{unique_token}/page.html",
                sanitized_html.encode("utf-8"),
                content_type="text/html"
            )
            normalized_text_path = await storage.save_file(
                f"websites/{website.id}/snapshots/{unique_token}/normalized.txt",
                normalized_text.encode("utf-8"),
                content_type="text/plain"
            )
            screenshot_path = None
            if exec_result.screenshot_bytes:
                screenshot_path = await storage.save_file(
                    f"websites/{website.id}/snapshots/{unique_token}/screenshot.png",
                    exec_result.screenshot_bytes,
                    content_type="image/png"
                )

            new_snapshot = Snapshot(
                website_id=website.id,
                content_hash=content_hash,
                page_title=page_title or exec_result.page_title,
                raw_html_path=raw_html_path,
                normalized_text_path=normalized_text_path,
                screenshot_path=screenshot_path,
                http_status=exec_result.http_status,
                response_time_ms=exec_result.response_time_ms,
                text_length=len(normalized_text)
            )
            db.add(new_snapshot)

            website.status = "HEALTHY"
            website.last_status_code = exec_result.http_status
            website.last_error_message = None
            await db.commit()

            logger.info(f"Baseline established for website {website.id} ('{website.name}')")
            return {
                "status": "baseline_established",
                "website_id": website.id,
                "snapshot_id": new_snapshot.id,
                "content_hash": content_hash,
                "response_time_ms": exec_result.response_time_ms
            }

        # Scenario B: Content is unchanged (hashes match)
        if HashEngine.are_hashes_identical(previous_snapshot.content_hash, content_hash):
            website.status = "HEALTHY"
            website.last_status_code = exec_result.http_status
            website.last_error_message = None
            await db.commit()

            logger.info(f"No changes detected for website {website.id} ('{website.name}')")
            return {
                "status": "unchanged",
                "website_id": website.id,
                "latest_snapshot_id": previous_snapshot.id,
                "content_hash": content_hash,
                "response_time_ms": exec_result.response_time_ms
            }

        # Scenario C: Meaningful Change Detected
        logger.info(f"Meaningful change detected for website {website.id}! Calculating diff...")

        # Read previous normalized text from storage
        previous_text = ""
        if previous_snapshot.normalized_text_path:
            try:
                prev_bytes = await storage.read_file(previous_snapshot.normalized_text_path)
                previous_text = prev_bytes.decode("utf-8")
            except Exception as e:
                logger.warning(f"Could not read previous snapshot text: {e}")

        # Compute structured diff
        diff_result = DiffEngine.compare(previous_text, normalized_text)

        # Persist new snapshot assets
        raw_html_path = await storage.save_file(
            f"websites/{website.id}/snapshots/{unique_token}/page.html",
            sanitized_html.encode("utf-8"),
            content_type="text/html"
        )
        normalized_text_path = await storage.save_file(
            f"websites/{website.id}/snapshots/{unique_token}/normalized.txt",
            normalized_text.encode("utf-8"),
            content_type="text/plain"
        )
        screenshot_path = None
        if exec_result.screenshot_bytes:
            screenshot_path = await storage.save_file(
                f"websites/{website.id}/snapshots/{unique_token}/screenshot.png",
                exec_result.screenshot_bytes,
                content_type="image/png"
            )

        new_snapshot = Snapshot(
            website_id=website.id,
            content_hash=content_hash,
            page_title=page_title or exec_result.page_title,
            raw_html_path=raw_html_path,
            normalized_text_path=normalized_text_path,
            screenshot_path=screenshot_path,
            http_status=exec_result.http_status,
            response_time_ms=exec_result.response_time_ms,
            text_length=len(normalized_text)
        )
        db.add(new_snapshot)
        await db.flush()  # obtain new_snapshot.id

        # Persist detailed diff JSON
        diff_data_path = await storage.save_file(
            f"websites/{website.id}/changes/{new_snapshot.id}_diff.json",
            json.dumps(diff_result).encode("utf-8"),
            content_type="application/json"
        )

        detected_change = DetectedChange(
            website_id=website.id,
            previous_snapshot_id=previous_snapshot.id,
            current_snapshot_id=new_snapshot.id,
            change_percentage=diff_result["change_percentage"],
            lines_added=diff_result["lines_added"],
            lines_removed=diff_result["lines_removed"],
            summary=diff_result["summary"],
            diff_data_path=diff_data_path,
            detected_at=now_utc
        )
        db.add(detected_change)
        await db.flush()

        # Update website health status
        website.status = "CHANGED"
        website.last_changed_at = now_utc
        website.last_status_code = exec_result.http_status
        website.last_error_message = None
        await db.commit()

        # Evaluate alert sensitivity rules
        should_alert, suppression_reason = MonitorService._evaluate_alert_rules(website, diff_result)
        if should_alert:
            try:
                await NotificationDispatcher.dispatch_change_alert(
                    db=db,
                    website=website,
                    change=detected_change,
                    summary=diff_result["summary"]
                )
            except Exception as alert_err:
                logger.error(f"Error dispatching notifications for change {detected_change.id}: {alert_err}")
        else:
            logger.info(f"Notification suppressed for website {website.id}: {suppression_reason}")

        logger.info(
            f"Change recorded for website {website.id}: "
            f"{diff_result['change_percentage']}% change ({diff_result['lines_added']} added, {diff_result['lines_removed']} removed)"
        )

        return {
            "status": "changed",
            "website_id": website.id,
            "change_id": detected_change.id,
            "new_snapshot_id": new_snapshot.id,
            "previous_snapshot_id": previous_snapshot.id,
            "change_percentage": diff_result["change_percentage"],
            "summary": diff_result["summary"],
            "response_time_ms": exec_result.response_time_ms
        }

    @classmethod
    async def simulate_change(cls, db: AsyncSession, website_id: int) -> Dict[str, Any]:
        """
        Simulates a meaningful content change on the target website.
        1. Ensures a baseline snapshot exists (runs execute_check if needed).
        2. Retrieves previous normalized text.
        3. Injects realistic mutated content (live announcements, updated service terms).
        4. Calculates structured diff, saves new snapshot and DetectedChange, and dispatches alerts.
        """
        website_query = await db.execute(
            select(Website)
            .where(Website.id == website_id)
            .options(selectinload(Website.ignored_regions))
        )
        website = website_query.scalar_one_or_none()
        if not website:
            raise ValueError(f"Website with id {website_id} not found")

        # Check for existing baseline snapshot
        snapshot_query = await db.execute(
            select(Snapshot)
            .where(Snapshot.website_id == website.id)
            .order_by(desc(Snapshot.created_at))
            .limit(1)
        )
        previous_snapshot = snapshot_query.scalar_one_or_none()

        if not previous_snapshot:
            await cls.execute_check(db=db, website_id=website_id)
            snapshot_query = await db.execute(
                select(Snapshot)
                .where(Snapshot.website_id == website.id)
                .order_by(desc(Snapshot.created_at))
                .limit(1)
            )
            previous_snapshot = snapshot_query.scalar_one_or_none()

        storage = get_storage_driver()
        previous_text = ""
        if previous_snapshot and previous_snapshot.normalized_text_path:
            try:
                prev_bytes = await storage.read_file(previous_snapshot.normalized_text_path)
                previous_text = prev_bytes.decode("utf-8")
            except Exception as e:
                logger.warning(f"Could not read previous snapshot text: {e}")

        if not previous_text:
            previous_text = f"{website.name} Initial Content\nTracking established for {website.url}"

        # Generate realistic mutated text
        now_utc = datetime.now(timezone.utc)
        timestamp_str = now_utc.strftime("%b %d, %Y - %H:%M UTC")

        simulated_additions = [
            f"[LIVE UPDATE] Flash Announcement: New documentation release & system features deployed ({timestamp_str}).",
            f"Special Notice: The service pricing and terms of service were revised on {timestamp_str}.",
            f"Active Notification: Change detection verified text mutation on {website.name}."
        ]

        lines = [line for line in previous_text.splitlines() if line.strip()]
        if len(lines) > 2:
            mutated_lines = lines[:1] + simulated_additions + lines[2:]
        else:
            mutated_lines = lines + simulated_additions

        mutated_text = "\n".join(mutated_lines)
        sanitized_html = f"<html><body><h1>{website.name} (Simulated Update)</h1><p>{mutated_text.replace(chr(10), '<br/>')}</p></body></html>"

        # Compute diff and hash
        diff_result = DiffEngine.compare(previous_text, mutated_text)
        content_hash = HashEngine.compute_sha256(mutated_text)
        unique_token = uuid.uuid4().hex[:12]

        raw_html_path = await storage.save_file(
            f"websites/{website.id}/snapshots/{unique_token}/page.html",
            sanitized_html.encode("utf-8"),
            content_type="text/html"
        )
        normalized_text_path = await storage.save_file(
            f"websites/{website.id}/snapshots/{unique_token}/normalized.txt",
            mutated_text.encode("utf-8"),
            content_type="text/plain"
        )

        new_snapshot = Snapshot(
            website_id=website.id,
            content_hash=content_hash,
            page_title=f"{website.name} (Updated Content)",
            raw_html_path=raw_html_path,
            normalized_text_path=normalized_text_path,
            screenshot_path=previous_snapshot.screenshot_path if previous_snapshot else None,
            http_status=200,
            response_time_ms=180,
            text_length=len(mutated_text)
        )
        db.add(new_snapshot)
        await db.flush()

        diff_data_path = await storage.save_file(
            f"websites/{website.id}/changes/{new_snapshot.id}_diff.json",
            json.dumps(diff_result).encode("utf-8"),
            content_type="application/json"
        )

        detected_change = DetectedChange(
            website_id=website.id,
            previous_snapshot_id=previous_snapshot.id if previous_snapshot else None,
            current_snapshot_id=new_snapshot.id,
            change_percentage=diff_result["change_percentage"],
            lines_added=diff_result["lines_added"],
            lines_removed=diff_result["lines_removed"],
            summary=diff_result["summary"],
            diff_data_path=diff_data_path,
            detected_at=now_utc
        )
        db.add(detected_change)
        await db.flush()

        website.status = "CHANGED"
        website.last_changed_at = now_utc
        website.last_checked_at = now_utc
        website.last_status_code = 200
        website.last_error_message = None
        await db.commit()

        # Dispatch alerts with sensitivity check
        should_alert, suppression_reason = MonitorService._evaluate_alert_rules(website, diff_result)
        if should_alert:
            try:
                await NotificationDispatcher.dispatch_change_alert(
                    db=db,
                    website=website,
                    change=detected_change,
                    summary=diff_result["summary"]
                )
            except Exception as alert_err:
                logger.error(f"Error dispatching notifications for simulated change: {alert_err}")
        else:
            logger.info(f"Notification suppressed for simulated change on website {website.id}: {suppression_reason}")

        return {
            "status": "changed",
            "website_id": website.id,
            "change_id": detected_change.id,
            "change_percentage": diff_result["change_percentage"],
            "summary": diff_result["summary"],
            "lines_added": diff_result["lines_added"],
            "lines_removed": diff_result["lines_removed"]
        }

    @staticmethod
    def _evaluate_alert_rules(
        website: Website,
        diff_result: Dict[str, Any]
    ) -> tuple[bool, Optional[str]]:
        min_pct = getattr(website, "min_change_percentage", 0.0) or 0.0
        pct = diff_result.get("change_percentage", 0.0)
        if pct < min_pct:
            return False, f"Change percentage ({pct}%) is below minimum threshold ({min_pct}%)."

        watchlist = getattr(website, "keyword_watchlist", None)
        if watchlist:
            keywords = [k.strip().lower() for k in watchlist.split(",") if k.strip()]
            if keywords:
                all_changed = []
                for c in diff_result.get("chunks", []):
                    if c.get("type") in ("replace", "insert", "delete"):
                        all_changed.extend(c.get("prev_lines", []))
                        all_changed.extend(c.get("curr_lines", []))
                changed_text_lower = " ".join(all_changed).lower()

                matched = [k for k in keywords if k in changed_text_lower]
                if not matched:
                    return False, f"No watchlist keywords ({', '.join(keywords)}) were detected in altered content."
                logger.info(f"Watchlist keywords matched for website {website.id}: {matched}")

        return True, None
