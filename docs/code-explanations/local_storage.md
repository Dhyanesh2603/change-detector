# Code Explanation: `local_storage.py`

## Matching Source File
`backend/app/storage/local_storage.py`

---

## 1. Purpose
Implements the `StorageDriver` interface for local filesystem persistence, providing safe, non-blocking asynchronous disk read/write operations and strict path traversal protection.

---

## 2. Responsibilities
- Resolving relative storage keys into absolute file paths within `settings.LOCAL_STORAGE_DIR`.
- Preventing path traversal attacks (`../`).
- Creating parent directories on the fly before writing files.
- Executing blocking filesystem operations asynchronously using `anyio.to_thread.run_sync`.
- Serving public relative API URLs for stored assets.

---

## 3. Main Classes
- `LocalStorageDriver(StorageDriver)`: Local disk implementation.

---

## 4. Main Functions
- `_resolve_path(relative_path: str) -> Path`: Sanitizes and validates that the target path strictly starts with `base_dir`.
- `save_file(relative_path: str, content: bytes, content_type: Optional[str]) -> str`: Writes bytes to disk.
- `read_file(relative_path: str) -> bytes`: Reads bytes from disk.
- `delete_file(relative_path: str) -> bool`: Deletes file if present.
- `exists(relative_path: str) -> bool`: Checks existence.
- `get_url(relative_path: str) -> str`: Returns API route `/api/v1/storage/{path}`.

---

## 5. Execution Flow
1. In `save_file`, `_resolve_path` normalizes slashes and validates boundaries.
2. Creates parent directories with `mkdir(parents=True, exist_ok=True)`.
3. Offloads synchronous `open(path, 'wb').write(content)` to AnyIO worker thread pool.
4. Returns normalized relative path string.

---

## 6. Dependencies
- `pathlib.Path`: Object-oriented filesystem paths.
- `anyio.to_thread.run_sync`: Asynchronous thread pool offloading.
- `app.storage.base.StorageDriver`: Abstract interface.

---

## 7. Interview Explanation
> *"LocalStorageDriver ensures non-blocking I/O in our FastAPI event loop. Directly writing 5MB screenshot buffers in an async function would stall the main asyncio event loop. By wrapping file operations in `anyio.to_thread.run_sync`, disk writes execute on background OS threads, keeping the API responsive to incoming requests."*

---

## 8. Common Modifications
- Adding automatic disk space cleanup or retention policies for snapshots older than 90 days.
