# Code Explanation: `scheduler_service.py`

## Matching Source File
`backend/app/scheduler/scheduler_service.py`

---

## 1. Purpose
Provides an in-process, asynchronous periodic scheduler loop running within the FastAPI event loop, automatically triggering website monitoring checks when distributed Celery workers are optional or not running.

---

## 2. Responsibilities
- Starting and stopping a background periodic polling loop during application lifespan events.
- Querying active websites from the database every 60 seconds.
- Evaluating whether current UTC time has passed `last_checked_at + check_interval_minutes`.
- Spawning asynchronous background tasks (`asyncio.create_task`) for due website checks so that long-running browser checks never block the scheduler tick.

---

## 3. Main Classes
- `AsyncSchedulerService`: Class managing the scheduler lifecycle and tick loop.

---

## 4. Main Functions
- `start(interval_seconds: int = 60) -> None`: Initiates background asyncio task.
- `stop() -> None`: Signals cancellation and awaits task termination.
- `_loop(interval_seconds: int) -> None`: Internal while loop with sleep intervals.
- `check_and_trigger_due_websites() -> List[int]`: Scans database and spawns tasks for due monitors.
- `_run_single_check(website_id: int) -> None`: Safe wrapper invoking `MonitorService.execute_check`.

---

## 5. Execution Flow
1. FastAPI `lifespan` calls `AsyncSchedulerService.start()`.
2. Every 60 seconds, `check_and_trigger_due_websites` queries active websites.
3. For each website where `now >= last_checked_at + interval`, calls `asyncio.create_task(_run_single_check(w.id))`.
4. Browser check executes asynchronously without blocking the loop.
5. On app shutdown, `stop()` sets stop event and cancels task cleanly.

---

## 6. Dependencies
- `asyncio`: Event loop and task creation.
- `app.core.database.AsyncSessionLocal`: Asynchronous session factory.
- `app.services.website_service.WebsiteService`: Website queries.
- `app.services.monitor_service.MonitorService`: Check execution.

---

## 7. Interview Explanation
> *"AsyncSchedulerService ensures zero-friction developer experience and high system resilience. A developer cloning this repository can run the entire platform locally with zero external services (no Redis daemon or Celery worker required). When deployed in production with high scale, Celery Beat seamlessly takes over distributed queuing."*

---

## 8. Common Modifications
- Integrating distributed leader election (using Redis locks or Postgres advisory locks) if running multiple API server replicas to prevent duplicate checks.
