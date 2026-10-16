from celery import Celery
from app.core.config import settings

# Create Celery application instance
celery_app = Celery(
    "change_detector_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,        # 5 minutes max per task
    task_soft_time_limit=240,   # 4 minutes soft limit
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
)

# Beat periodic task schedule
celery_app.conf.beat_schedule = {
    "check-due-websites-every-minute": {
        "task": "app.workers.tasks.check_due_websites_task",
        "schedule": 60.0,  # every 60 seconds
    },
}
