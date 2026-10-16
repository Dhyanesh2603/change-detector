# Code Explanation: `change_service.py`

## Matching Source File
`backend/app/services/change_service.py`

---

## 1. Purpose
Manages retrieval of `DetectedChange` records and loads structured JSON diff opcodes from the storage layer for rendering in the interactive React side-by-side DiffViewer.

---

## 2. Responsibilities
- Querying detected change records by ID.
- Retrieving chronologically sorted change history for a single website.
- Retrieving recent changes across all websites monitored by a specific user.
- Loading and deserializing the structured diff JSON file (`diff_data_path`).

---

## 3. Main Classes
- `ChangeService`: Static service for detected change queries and diff loading.

---

## 4. Main Functions
- `get_by_id(db: AsyncSession, change_id: int) -> Optional[DetectedChange]`
- `get_by_website(db: AsyncSession, website_id: int, limit: int) -> List[DetectedChange]`
- `get_recent_by_user(db: AsyncSession, user_id: int, limit: int) -> List[DetectedChange]`
- `get_change_diff_payload(change: DetectedChange) -> Dict[str, Any]`: Loads JSON diff opcodes from storage.

---

## 5. Execution Flow
1. User clicks a change event on the dashboard.
2. API calls `ChangeService.get_by_id(db, change_id)`.
3. Verifies user ownership through `Website.user_id`.
4. Reads `diff_data_path` via `get_storage_driver().read_file(...)`.
5. Deserializes JSON string into dictionary containing `chunks`, `unified_diff`, and `summary`.
6. Returns unified `DetectedChangeDetail` response.

---

## 6. Dependencies
- `app.models.detected_change.DetectedChange`: ORM model.
- `app.models.website.Website`: Join relation for user scoping.
- `app.storage.get_storage_driver`: Unstructured asset storage.

---

## 7. Interview Explanation
> *"ChangeService decouples high-level mutation metrics (like change percentage and line counts stored in Postgres) from the granular line-by-line diff opcodes stored in JSON. This ensures that dashboard feeds load in milliseconds without reading heavy diff trees until the developer clicks to inspect a specific change."*

---

## 8. Common Modifications
- Caching recent diff JSON payloads in Redis for high-traffic public dashboards.
