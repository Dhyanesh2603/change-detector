from app.storage.base import StorageDriver
from app.storage.local_storage import LocalStorageDriver
from app.storage.s3_storage import S3StorageDriver
from app.core.config import settings

_storage_instance: StorageDriver | None = None


def get_storage_driver() -> StorageDriver:
    """
    Singleton factory returning the configured StorageDriver instance.
    Defaults to LocalStorageDriver; switches to S3StorageDriver if configured.
    """
    global _storage_instance
    if _storage_instance is None:
        if settings.STORAGE_DRIVER.lower() == "s3":
            _storage_instance = S3StorageDriver()
        else:
            _storage_instance = LocalStorageDriver()
    return _storage_instance


__all__ = ["StorageDriver", "LocalStorageDriver", "S3StorageDriver", "get_storage_driver"]
