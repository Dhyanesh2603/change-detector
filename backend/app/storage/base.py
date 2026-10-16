from abc import ABC, abstractmethod
from typing import Optional


class StorageDriver(ABC):
    """
    Abstract Storage Driver defining contract for persisting snapshots,
    raw HTML, normalized text, diff data, and screenshots.
    Decouples storage mechanism from business logic (Local vs S3).
    """

    @abstractmethod
    async def save_file(self, relative_path: str, content: bytes, content_type: Optional[str] = None) -> str:
        """
        Saves binary content to storage at relative_path.
        Returns the resolved storage key or URI.
        """
        pass

    @abstractmethod
    async def read_file(self, relative_path: str) -> bytes:
        """
        Reads binary content from storage at relative_path.
        Raises FileNotFoundError if object does not exist.
        """
        pass

    @abstractmethod
    async def delete_file(self, relative_path: str) -> bool:
        """
        Deletes the file located at relative_path.
        Returns True if deleted, False if not found.
        """
        pass

    @abstractmethod
    async def exists(self, relative_path: str) -> bool:
        """
        Checks whether a file exists at relative_path.
        """
        pass

    @abstractmethod
    def get_url(self, relative_path: str) -> str:
        """
        Returns a public or API-accessible URL or path representation.
        """
        pass
