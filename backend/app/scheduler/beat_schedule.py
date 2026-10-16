from app.workers.celery_app import celery_app

"""
Celery Beat Scheduler Schedule Definition.
Defines crontabs and interval triggers for periodic change detection.
"""

BEAT_SCHEDULE = {
    "check-all-due-monitors": {
        "task": "app.workers.tasks.check_due_websites_task",
        "schedule": 60.0,  # runs every 60 seconds
        "options": {"expires": 50},
    }
}

celery_app.conf.beat_schedule = BEAT_SCHEDULE
