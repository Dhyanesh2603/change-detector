import json
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.detected_change import DetectedChange
from app.models.website import Website
from app.storage import get_storage_driver
from app.core.logging import logger


class ChangeService:
    """
    Manages querying and detail loading for detected changes.
    """

    @staticmethod
    async def get_by_id(db: AsyncSession, change_id: int) -> Optional[DetectedChange]:
        result = await db.execute(select(DetectedChange).where(DetectedChange.id == change_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_website(db: AsyncSession, website_id: int, limit: int = 50) -> List[DetectedChange]:
        result = await db.execute(
            select(DetectedChange)
            .where(DetectedChange.website_id == website_id)
            .order_by(desc(DetectedChange.detected_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_recent_by_user(db: AsyncSession, user_id: int, limit: int = 20) -> List[DetectedChange]:
        result = await db.execute(
            select(DetectedChange)
            .join(Website, Website.id == DetectedChange.website_id)
            .where(Website.user_id == user_id)
            .order_by(desc(DetectedChange.detected_at))
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_change_diff_payload(change: DetectedChange) -> Dict[str, Any]:
        """
        Reads structured diff JSON from storage for rendering in the Diff Viewer UI.
        """
        if not change.diff_data_path:
            return {}

        storage = get_storage_driver()
        try:
            diff_bytes = await storage.read_file(change.diff_data_path)
            return json.loads(diff_bytes.decode("utf-8"))
        except Exception as e:
            logger.error(f"Failed to load diff json from {change.diff_data_path}: {e}")
            return {}
