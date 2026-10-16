import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from app.core.database import AsyncSessionLocal
from app.services.website_service import WebsiteService
from app.services.monitor_service import MonitorService
from app.core.logging import logger
from app.utils.datetime_utils import ensure_utc

_scheduler_task: Optional[asyncio.Task] = None
_stop_event = asyncio.Event()


class AsyncSchedulerService:
    """
    Lightweight, resilient asynchronous scheduler that runs within the FastAPI
    event loop. Automatically checks due websites at configurable intervals.
    Allows zero-dependency standalone operation while Celery workers handle distributed queues.
    """

    @classmethod
    async def start(cls, interval_seconds: int = 60) -> None:
        """
        Starts the background periodic polling loop.
        """
        global _scheduler_task, _stop_event
        _stop_event.clear()
        _scheduler_task = asyncio.create_task(cls._loop(interval_seconds))
        logger.info(f"AsyncSchedulerService started (polling every {interval_seconds}s)")

    @classmethod
    async def stop(cls) -> None:
        """
        Signals the scheduler loop to stop cleanly.
        """
        global _scheduler_task, _stop_event
        _stop_event.set()
        if _scheduler_task:
            _scheduler_task.cancel()
            try:
                await _scheduler_task
            except asyncio.CancelledError:
                pass
        logger.info("AsyncSchedulerService stopped")

    @classmethod
    async def _loop(cls, interval_seconds: int) -> None:
        # Initial sleep on startup to let app stabilize
        await asyncio.sleep(5)

        while not _stop_event.is_set():
            try:
                await cls.check_and_trigger_due_websites()
            except Exception as e:
                logger.error(f"Error in scheduler tick: {e}")

            try:
                await asyncio.wait_for(_stop_event.wait(), timeout=interval_seconds)
            except asyncio.TimeoutError:
                pass

    @classmethod
    async def check_and_trigger_due_websites(cls) -> List[int]:
        """
        Identifies all active websites that have passed their check_interval_minutes,
        and triggers MonitorService.execute_check for each one.
        """
        now = datetime.now(timezone.utc)
        triggered_ids: List[int] = []

        async with AsyncSessionLocal() as db:
            websites = await WebsiteService.get_due_websites(db)

            for w in websites:
                if not w.is_active:
                    continue

                is_due = False
                last_checked = ensure_utc(w.last_checked_at)
                if not last_checked:
                    is_due = True
                else:
                    due_time = last_checked + timedelta(minutes=w.check_interval_minutes)
                    if now >= due_time:
                        is_due = True

                if is_due:
                    triggered_ids.append(w.id)
                    # Trigger in background task so checks don't block the scheduler loop
                    asyncio.create_task(cls._run_single_check(w.id))

        if triggered_ids:
            logger.info(f"[Scheduler] Triggered {len(triggered_ids)} due website checks: {triggered_ids}")
        return triggered_ids

    @staticmethod
    async def _run_single_check(website_id: int) -> None:
        try:
            async with AsyncSessionLocal() as db:
                await MonitorService.execute_check(db=db, website_id=website_id)
        except Exception as e:
            logger.error(f"[Scheduler] Background check failed for website {website_id}: {e}")
