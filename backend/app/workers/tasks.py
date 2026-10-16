import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from celery.utils.log import get_task_logger
from app.workers.celery_app import celery_app
from app.core.database import AsyncSessionLocal
from app.services.monitor_service import MonitorService
from app.services.website_service import WebsiteService
from app.utils.datetime_utils import ensure_utc

logger = get_task_logger(__name__)


def _run_async(coro):
    """
    Executes an asynchronous coroutine inside a synchronous Celery worker context.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            new_loop = asyncio.new_event_loop()
            try:
                return new_loop.run_until_complete(coro)
            finally:
                new_loop.close()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def check_website_task(self, website_id: int) -> Dict[str, Any]:
    """
    Celery task that triggers the end-to-end monitoring check for a specific website.
    Includes automated retries on unexpected network failures.
    """
    logger.info(f"[Celery] Processing check for website_id={website_id}")

    async def _execute():
        async with AsyncSessionLocal() as db:
            return await MonitorService.execute_check(db=db, website_id=website_id)

    try:
        result = _run_async(_execute())
        logger.info(f"[Celery] Check finished for website_id={website_id}: {result.get('status')}")
        return result
    except Exception as exc:
        logger.error(f"[Celery] Error checking website_id={website_id}: {exc}")
        raise self.retry(exc=exc)


@celery_app.task
def check_due_websites_task() -> Dict[str, Any]:
    """
    Periodic Celery Beat task that iterates over all active websites,
    evaluates check_interval_minutes, and queues tasks for due targets.
    """
    logger.info("[Celery Beat] Evaluating due websites...")

    async def _find_due():
        async with AsyncSessionLocal() as db:
            websites = await WebsiteService.get_due_websites(db)
            now = datetime.now(timezone.utc)
            due_ids: List[int] = []

            for w in websites:
                if not w.is_active:
                    continue
                last_checked = ensure_utc(w.last_checked_at)
                if not last_checked:
                    due_ids.append(w.id)
                else:
                    threshold = last_checked + timedelta(minutes=w.check_interval_minutes)
                    if now >= threshold:
                        due_ids.append(w.id)
            return due_ids

    due_website_ids = _run_async(_find_due())
    logger.info(f"[Celery Beat] Queuing {len(due_website_ids)} due website checks.")

    dispatched = 0
    for w_id in due_website_ids:
        check_website_task.delay(w_id)
        dispatched += 1

    return {"dispatched_count": dispatched, "website_ids": due_website_ids}
