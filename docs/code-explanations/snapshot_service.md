# Code Explanation: `snapshot_service.py`

## Matching Source File
`backend/app/services/snapshot_service.py`

---

## 1. Purpose
Provides query methods for retrieving historical `Snapshot` entities and loads raw HTML and normalized text content from the storage layer for detailed client inspection.

---

## 2. Responsibilities
- Querying individual snapshots by ID.
- Querying chronologically ordered snapshot history for a given website.
- Reading stored `raw_html_path` and `normalized_text_path` files via `StorageDriver`.
- Gracefully handling missing storage files or I/O exceptions.

---

## 3. Main Classes
- `SnapshotService`: Static service managing snapshot querying and asset loading.

---

## 4. Main Functions
- `get_by_id(db: AsyncSession, snapshot_id: int) -> Optional[Snapshot]`
- `get_by_website(db: AsyncSession, website_id: int, limit: int) -> List[Snapshot]`
- `get_snapshot_content(snapshot: Snapshot) -> dict`: Reads raw HTML and normalized text files from storage and decodes into UTF-8 strings.

---

## 5. Execution Flow
1. API router calls `get_snapshot_detail(snapshot_id)`.
2. `SnapshotService.get_by_id` fetches database record.
3. `get_snapshot_content` uses `get_storage_driver().read_file(snapshot.raw_html_path)`.
4. Decodes binary content safely with `replace` error handling.
5. Returns content dictionary for JSON serialization.

---

## 6. Dependencies
- `sqlalchemy.ext.asyncio.AsyncSession`: Database session.
- `app.models.snapshot.Snapshot`: ORM model.
- `app.storage.get_storage_driver`: File retrieval driver.

---

## 7. Interview Explanation
> *"SnapshotService maintains the boundary between relational metadata and unstructured storage assets. While the database row contains metrics like response times and hashes, SnapshotService lazily loads the multi-megabyte HTML strings from disk only when a developer explicitly opens a detailed snapshot inspector."*

---

## 8. Common Modifications
- Adding content compression (e.g. gzip / brotli decompression) during asset reading.
- Adding pre-signed URL generation for direct client downloads from S3.
