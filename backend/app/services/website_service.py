from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.models.website import Website
from app.models.ignored_region import IgnoredRegion
from app.models.snapshot import Snapshot
from app.models.detected_change import DetectedChange
from app.schemas.website import WebsiteCreate, WebsiteUpdate
from app.core.logging import logger


class WebsiteService:
    """
    Manages CRUD operations and lifecycle state transitions for monitored websites.
    """

    @staticmethod
    async def get_by_id(db: AsyncSession, website_id: int, user_id: Optional[int] = None) -> Optional[Website]:
        query = select(Website).where(Website.id == website_id)
        if user_id is not None:
            query = query.where(Website.user_id == user_id)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_user(db: AsyncSession, user_id: int) -> List[Website]:
        result = await db.execute(
            select(Website)
            .where(Website.user_id == user_id)
            .order_by(desc(Website.created_at))
        )
        return list(result.scalars().all())

    @staticmethod
    async def create(db: AsyncSession, user_id: int, website_in: WebsiteCreate) -> Website:
        website = Website(
            user_id=user_id,
            name=website_in.name.strip(),
            url=str(website_in.url).strip(),
            check_interval_minutes=website_in.check_interval_minutes,
            is_active=website_in.is_active,
            status="PENDING"
        )
        db.add(website)
        await db.flush()

        # Add initial ignored selectors if specified
        if website_in.ignored_selectors:
            for selector in website_in.ignored_selectors:
                if selector.strip():
                    region = IgnoredRegion(
                        website_id=website.id,
                        selector_type="css",
                        selector_value=selector.strip(),
                        description="Initial noise filter"
                    )
                    db.add(region)

        await db.commit()
        await db.refresh(website)
        return website

    @staticmethod
    async def update(db: AsyncSession, website: Website, website_in: WebsiteUpdate) -> Website:
        if website_in.name is not None:
            website.name = website_in.name.strip()
        if website_in.url is not None:
            website.url = str(website_in.url).strip()
        if website_in.check_interval_minutes is not None:
            website.check_interval_minutes = website_in.check_interval_minutes
        if website_in.is_active is not None:
            website.is_active = website_in.is_active

        await db.commit()
        await db.refresh(website)
        return website

    @staticmethod
    async def delete(db: AsyncSession, website: Website) -> None:
        await db.delete(website)
        await db.commit()

    @staticmethod
    async def get_due_websites(db: AsyncSession) -> List[Website]:
        """
        Retrieves all active websites that are due for a scheduled check.
        """
        result = await db.execute(
            select(Website).where(Website.is_active == True)
        )
        return list(result.scalars().all())
