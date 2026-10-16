# Code Explanation: `tasks.py`

## Matching Source File
`backend/app/workers/tasks.py`

---

## 1. Purpose
Defines distributed Celery background tasks for individual website monitoring checks and periodic Celery Beat schedule dispatching.

---

## 2. Responsibilities
- Bridging Celery's synchronous worker execution model with modern asynchronous coroutines (`_run_async`).
- Enforcing task retry policies on transient network or browser errors.
- Evaluating due websites and broadcasting individual check tasks across worker queues.

---

## 3. Main Functions
- `_run_async(coro)`: Helper executing an asynchronous coroutine safely inside the Celery worker process.
- `check_website_task(self, website_id: int) -> Dict[str, Any]`: Celery task bound to retries (`max_retries=3`, `default_retry_delay=60s`).
- `check_due_websites_task() -> Dict[str, Any]`: Periodic Celery Beat task scanning due websites and enqueuing jobs via `.delay()`.

---

## 4. Execution Flow
1. Celery Beat triggers `check_due_websites_task`.
2. Queries database for due websites.
3. For each due website ID, calls `check_website_task.delay(website_id)`.
4. A distributed Celery worker process pops the task from Redis.
5. `_run_async` executes `MonitorService.execute_check(db, website_id)`.
6. Result is returned and cached in Celery result backend.

---

## 5. Dependencies
- `celery`: Distributed task queue.
- `app.workers.celery_app.celery_app`: Configured Celery application.
- `app.services.monitor_service.MonitorService`: Domain check logic.
- `app.core.database.AsyncSessionLocal`: Session factory.

---

## 6. Interview Explanation
> *"The Celery tasks module decouples task queuing from task execution. Celery handles serialization, dead-letter retries, and worker concurrency, while MonitorService contains the pure domain logic. This keeps worker code clean, testable, and maintainable."*

---

## 7. Common Modifications
- Routing heavy Playwright tasks to a dedicated GPU or high-memory worker queue using Celery task routes (`task_routes = {'check_website_task': {'queue': 'heavy_browser'}}`).
