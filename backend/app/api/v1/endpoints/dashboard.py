import json
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.storage import get_storage_driver
from app.core.database import get_db
from app.models.user import User
from app.models.website import Website
from app.models.snapshot import Snapshot
from app.models.detected_change import DetectedChange
from app.schemas.dashboard import (
    DashboardSummary,
    StatusCounts,
    ActivityTimelineItem,
    HealthMetricPoint,
)
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


from app.utils.datetime_utils import ensure_utc


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Returns aggregated metrics, health breakdown, latency charts, and recent activity timeline.
    """
    now = datetime.now(timezone.utc)
    since_24h = now - timedelta(hours=24)

    # 1. Fetch user's websites
    websites_result = await db.execute(
        select(Website).where(Website.user_id == current_user.id)
    )
    websites = websites_result.scalars().all()
    website_ids = [w.id for w in websites]

    counts = StatusCounts()
    counts.total = len(websites)
    for w in websites:
        st = (w.status or "PENDING").upper()
        if st == "HEALTHY":
            counts.healthy += 1
        elif st == "CHANGED":
            counts.changed += 1
        elif st == "FAILED":
            counts.failed += 1
        elif st == "CHECKING":
            counts.checking += 1
        else:
            counts.pending += 1

    if not website_ids:
        return DashboardSummary(
            status_counts=counts,
            total_checks_24h=0,
            total_changes_24h=0,
            average_response_time_ms=0,
            recent_activity=[],
            health_metrics=[]
        )

    # 2. Fetch all recent snapshots for user's websites and filter in memory using ensure_utc
    snapshots_result = await db.execute(
        select(Snapshot)
        .where(Snapshot.website_id.in_(website_ids))
        .order_by(desc(Snapshot.created_at))
        .limit(200)
    )
    all_snapshots = snapshots_result.scalars().all()
    snapshots_24h = [s for s in all_snapshots if ensure_utc(s.created_at) >= since_24h]
    total_checks_24h = len(snapshots_24h)

    avg_latency = 0
    if total_checks_24h > 0:
        total_latency = sum(s.response_time_ms for s in snapshots_24h)
        avg_latency = int(total_latency / total_checks_24h)

    # 3. Fetch recent detected changes
    changes_result = await db.execute(
        select(DetectedChange)
        .where(DetectedChange.website_id.in_(website_ids))
        .order_by(desc(DetectedChange.detected_at))
        .limit(200)
    )
    all_changes = changes_result.scalars().all()
    changes_24h = [c for c in all_changes if ensure_utc(c.detected_at) >= since_24h]
    total_changes_24h = len(changes_24h)

    # 4. Recent activity timeline (combining changes and checks)
    recent_changes_query = await db.execute(
        select(DetectedChange, Website)
        .join(Website, Website.id == DetectedChange.website_id)
        .where(Website.user_id == current_user.id)
        .order_by(desc(DetectedChange.detected_at))
        .limit(15)
    )
    recent_changes = recent_changes_query.all()
    storage = get_storage_driver()
    activity: List[ActivityTimelineItem] = []
    for change, website in recent_changes:
        preview_added: List[str] = []
        preview_removed: List[str] = []
        if change.diff_data_path:
            try:
                diff_bytes = await storage.read_file(change.diff_data_path)
                diff_json = json.loads(diff_bytes.decode("utf-8"))
                for chunk in diff_json.get("chunks", []):
                    if chunk.get("type") in ("insert", "replace"):
                        for line in chunk.get("curr_lines", []):
                            if line.strip() and len(preview_added) < 5:
                                preview_added.append(line.strip())
                    if chunk.get("type") in ("delete", "replace"):
                        for line in chunk.get("prev_lines", []):
                            if line.strip() and len(preview_removed) < 5:
                                preview_removed.append(line.strip())
            except Exception:
                pass

        activity.append(ActivityTimelineItem(
            id=change.id,
            website_id=website.id,
            website_name=website.name,
            website_url=website.url,
            event_type="change_detected",
            change_percentage=change.change_percentage,
            summary=change.summary,
            lines_added=change.lines_added,
            lines_removed=change.lines_removed,
            text_preview_added=preview_added,
            text_preview_removed=preview_removed,
            occurred_at=ensure_utc(change.detected_at)
        ))

    # If no changes yet, surface tracked websites with their captured baseline text!
    if not activity and user_websites:
        for website in user_websites[:8]:
            snap_res = await db.execute(
                select(Snapshot)
                .where(Snapshot.website_id == website.id)
                .order_by(desc(Snapshot.created_at))
                .limit(1)
            )
            latest_snap = snap_res.scalar_one_or_none()
            text_snippet = None
            if latest_snap and latest_snap.normalized_text_path:
                try:
                    txt_bytes = await storage.read_file(latest_snap.normalized_text_path)
                    raw_text = txt_bytes.decode("utf-8")
                    text_snippet = "\n".join([l for l in raw_text.splitlines() if l.strip()][:5])
                except Exception:
                    pass

            activity.append(ActivityTimelineItem(
                id=website.id,
                website_id=website.id,
                website_name=website.name,
                website_url=website.url,
                event_type="baseline_established",
                change_percentage=0.0,
                summary=f"Tracking active • Baseline captured ({latest_snap.text_length if latest_snap else 0} chars, HTTP {latest_snap.http_status if latest_snap else 200})",
                lines_added=0,
                lines_removed=0,
                tracked_text_snippet=text_snippet,
                occurred_at=ensure_utc(latest_snap.created_at if latest_snap else website.created_at)
            ))

    # 5. Latency and health metric points for charts (aggregated in 4-hour buckets)
    health_metrics: List[HealthMetricPoint] = []
    for hour_offset in range(24, 0, -4):
        window_start = now - timedelta(hours=hour_offset)
        window_end = window_start + timedelta(hours=4)
        label = window_start.strftime("%H:%M")

        window_snapshots = [s for s in snapshots_24h if window_start <= ensure_utc(s.created_at) < window_end]
        avg_rt = 0
        if window_snapshots:
            avg_rt = int(sum(s.response_time_ms for s in window_snapshots) / len(window_snapshots))
        else:
            avg_rt = avg_latency or 350

        healthy_cnt = sum(1 for s in window_snapshots if s.http_status in (200, 301, 302))
        failed_cnt = sum(1 for s in window_snapshots if s.http_status not in (200, 301, 302))

        health_metrics.append(HealthMetricPoint(
            timestamp=label,
            response_time_ms=avg_rt,
            healthy_count=healthy_cnt if window_snapshots else counts.healthy,
            failed_count=failed_cnt
        ))

    return DashboardSummary(
        status_counts=counts,
        total_checks_24h=total_checks_24h,
        total_changes_24h=total_changes_24h,
        average_response_time_ms=avg_latency,
        recent_activity=activity,
        health_metrics=health_metrics
    )
