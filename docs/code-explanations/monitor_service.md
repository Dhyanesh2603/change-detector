# Code Explanation: `monitor_service.py`

## Matching Source File
`backend/app/services/monitor_service.py`

---

## 1. Purpose
Acts as the central domain orchestrator that coordinates the end-to-end monitoring check: browser page capture, DOM sanitization, noise filtering, content hashing, snapshot persistence, diff calculation, health status transition, and notification dispatching.

---

## 2. Responsibilities
- Loading the `Website` entity and its associated `IgnoredRegion` noise rules.
- Transitioning website status to `CHECKING` and recording check timestamps.
- Invoking `BrowserRunner.capture_page` to render the target URL.
- Invoking `HTMLNormalizer` to extract sanitized HTML and normalized text.
- Generating SHA-256 digests and querying the most recent baseline snapshot.
- Persisting assets (`page.html`, `normalized.txt`, `screenshot.png`, `diff.json`) via `StorageDriver`.
- Inserting `Snapshot` and `DetectedChange` rows upon mutation.
- Invoking `NotificationDispatcher` to broadcast alerts across active channels.
- Transitioning website status to `HEALTHY`, `CHANGED`, or `FAILED`.

---

## 3. Main Classes
- `MonitorService`: Static domain service orchestrating the check workflow.

---

## 4. Main Functions
- `execute_check(db: AsyncSession, website_id: int) -> Dict[str, Any]`: Executes the complete monitoring check pipeline for a single website.

---

## 5. Execution Flow
1. Queries `Website` from PostgreSQL with active `ignored_regions`.
2. Marks status as `CHECKING` and commits.
3. Calls `BrowserRunner.capture_page(website.url)`.
4. If capture fails, updates status to `FAILED`, logs error message, and exits.
5. Passes HTML to `HTMLNormalizer.clean_html_and_extract_text()`.
6. Calculates `content_hash = HashEngine.compute_sha256(normalized_text)`.
7. Queries latest snapshot from database:
   - **Baseline:** If no snapshot exists, saves files via `StorageDriver`, inserts `Snapshot`, sets status `HEALTHY`.
   - **Unchanged:** If `latest_snapshot.content_hash == content_hash`, updates `last_checked_at`, sets status `HEALTHY` without creating new snapshot.
   - **Changed:** If hashes differ:
     - Reads previous normalized text from storage.
     - Runs `DiffEngine.compare(previous_text, normalized_text)`.
     - Persists new snapshot files and diff JSON.
     - Inserts `Snapshot` and `DetectedChange` rows.
     - Updates website status to `CHANGED`.
     - Dispatches alerts via `NotificationDispatcher.dispatch_change_alert()`.
8. Returns execution outcome dictionary.

---

## 6. Dependencies
- `app.models.*`: `Website`, `Snapshot`, `DetectedChange`.
- `app.workers.browser_runner.BrowserRunner`: Playwright execution.
- `app.diff.*`: `HTMLNormalizer`, `HashEngine`, `DiffEngine`.
- `app.storage.get_storage_driver`: Asset persistence.
- `app.notifications.dispatcher.NotificationDispatcher`: Alert dispatching.

---

## 7. Interview Explanation
> *"MonitorService embodies the core business logic of our platform. It coordinates five distinct subsystems (Browser Automation, Noise Normalization, Cryptographic Verification, Asset Storage, and Alerting) within a clean, transactionally safe pipeline. By keeping this coordination in a dedicated domain service, our API endpoints and background workers remain thin wrappers around a reusable domain core."*

---

## 8. Common Modifications
- Injecting rate-limiting tokens or domain-level cooldowns before executing browser checks.
- Adding custom webhook callbacks to alert third-party systems upon check completion.
