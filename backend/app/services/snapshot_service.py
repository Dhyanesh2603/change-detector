from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.snapshot import Snapshot
from app.storage import get_storage_driver
from app.core.logging import logger


class SnapshotService:
    """
    Manages querying and asset retrieval for website snapshots.
    """

    @staticmethod
    async def get_by_id(db: AsyncSession, snapshot_id: int) -> Optional[Snapshot]:
        result = await db.execute(select(Snapshot).where(Snapshot.id == snapshot_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_website(db: AsyncSession, website_id: int, limit: int = 50) -> List[Snapshot]:
        result = await db.execute(
            select(Snapshot)
            .where(Snapshot.website_id == website_id)
            .order_by(desc(Snapshot.created_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_snapshot_content(snapshot: Snapshot) -> dict:
        """
        Loads raw HTML and normalized text from storage for detailed side-by-side inspection.
        """
        storage = get_storage_driver()
        raw_html = ""
        normalized_text = ""

        if snapshot.raw_html_path:
            try:
                content_bytes = await storage.read_file(snapshot.raw_html_path)
                raw_html = content_bytes.decode("utf-8", errors="replace")
            except Exception as e:
                logger.warning(f"Could not read raw HTML from storage: {e}")

        if snapshot.normalized_text_path:
            try:
                text_bytes = await storage.read_file(snapshot.normalized_text_path)
                normalized_text = text_bytes.decode("utf-8", errors="replace")
            except Exception as e:
                logger.warning(f"Could not read normalized text from storage: {e}")

        return {
            "raw_html": raw_html,
            "normalized_text": normalized_text
        }
