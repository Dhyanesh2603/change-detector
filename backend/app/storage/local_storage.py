import os
from pathlib import Path
from typing import Optional
import anyio
from app.storage.base import StorageDriver
from app.core.config import settings
from app.core.logging import logger


class LocalStorageDriver(StorageDriver):
    """
    Local filesystem implementation of StorageDriver.
    Stores files under settings.LOCAL_STORAGE_DIR with sanitized paths.
    Uses anyio.to_thread.run_sync for non-blocking disk I/O.
    """

    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = Path(base_dir or settings.LOCAL_STORAGE_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"LocalStorageDriver initialized at {self.base_dir}")

    def _resolve_path(self, relative_path: str) -> Path:
        """
        Ensures the relative path stays within the base directory to prevent path traversal attacks.
        """
        clean_rel = relative_path.replace("\\", "/").lstrip("/")
        target_path = (self.base_dir / clean_rel).resolve()
        if not str(target_path).startswith(str(self.base_dir)):
            raise ValueError(f"Path traversal detected: {relative_path}")
        return target_path

    async def save_file(self, relative_path: str, content: bytes, content_type: Optional[str] = None) -> str:
        target_path = self._resolve_path(relative_path)
        target_path.parent.mkdir(parents=True, exist_ok=True)

        def _write():
            with open(target_path, "wb") as f:
                f.write(content)

        await anyio.to_thread.run_sync(_write)
        return relative_path.replace("\\", "/").lstrip("/")

    async def read_file(self, relative_path: str) -> bytes:
        target_path = self._resolve_path(relative_path)
        if not target_path.exists() or not target_path.is_file():
            raise FileNotFoundError(f"File not found: {relative_path}")

        def _read() -> bytes:
            with open(target_path, "rb") as f:
                return f.read()

        return await anyio.to_thread.run_sync(_read)

    async def delete_file(self, relative_path: str) -> bool:
        try:
            target_path = self._resolve_path(relative_path)
            if target_path.exists() and target_path.is_file():
                def _unlink():
                    target_path.unlink()
                await anyio.to_thread.run_sync(_unlink)
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting file {relative_path}: {e}")
            return False

    async def exists(self, relative_path: str) -> bool:
        try:
            target_path = self._resolve_path(relative_path)
            return target_path.exists() and target_path.is_file()
        except Exception:
            return False

    def get_url(self, relative_path: str) -> str:
        clean_rel = relative_path.replace("\\", "/").lstrip("/")
        return f"/api/v1/storage/{clean_rel}"
