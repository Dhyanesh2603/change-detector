# Code Explanation: `website_service.py`

## Matching Source File
`backend/app/services/website_service.py`

---

## 1. Purpose
Encapsulates database querying, creation, updating, and deletion operations for `Website` monitoring target entities and queries due monitors for the scheduler.

---

## 2. Responsibilities
- Fetching websites by ID with ownership scoping (`user_id`).
- Retrieving list of websites owned by an authenticated user.
- Creating new `Website` rows with default parameters and optional initial noise filter rules.
- Updating monitoring frequencies and active flags.
- Deleting websites with cascading deletion of snapshots and changes.
- Querying all active monitors for scheduler due-check evaluation.

---

## 3. Main Classes
- `WebsiteService`: Static domain service for website lifecycle management.

---

## 4. Main Functions
- `get_by_id(db: AsyncSession, website_id: int, user_id: Optional[int]) -> Optional[Website]`
- `get_all_by_user(db: AsyncSession, user_id: int) -> List[Website]`
- `create(db: AsyncSession, user_id: int, website_in: WebsiteCreate) -> Website`
- `update(db: AsyncSession, website: Website, website_in: WebsiteUpdate) -> Website`
- `delete(db: AsyncSession, website: Website) -> None`
- `get_due_websites(db: AsyncSession) -> List[Website]`

---

## 5. Execution Flow
- Uses asynchronous SQLAlchemy queries (`select(Website)...`) to execute non-blocking database I/O.
- Enforces strict tenant isolation by scoping lookups by `user_id`.

---

## 6. Dependencies
- `sqlalchemy.ext.asyncio.AsyncSession`: Asynchronous database session.
- `app.models.website.Website`: SQLAlchemy ORM model.
- `app.schemas.website.*`: Pydantic request schemas.

---

## 7. Interview Explanation
> *"WebsiteService isolates data access and business constraints for monitored targets. For example, when adding a website with initial noise selectors, WebsiteService handles creating both the parent Website and child IgnoredRegion records within a single database transaction, ensuring atomicity."*

---

## 8. Common Modifications
- Adding pagination and sorting parameters (`limit`, `offset`, `sort_by`) for large enterprise accounts.
- Adding domain-level URL deduplication guards per user.
