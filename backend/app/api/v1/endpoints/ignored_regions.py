from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.models.website import Website
from app.models.ignored_region import IgnoredRegion
from app.schemas.ignored_region import (
    IgnoredRegionCreate,
    IgnoredRegionUpdate,
    IgnoredRegionResponse,
)
from app.services.website_service import WebsiteService
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/ignored-regions", tags=["Ignored Regions"])


@router.post("/website/{website_id}", response_model=IgnoredRegionResponse, status_code=status.HTTP_201_CREATED)
async def add_ignored_region(
    website_id: int,
    region_in: IgnoredRegionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Adds a dynamic noise filter selector (CSS, tag, xpath) to a monitored website.
    """
    website = await WebsiteService.get_by_id(db, website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    region = IgnoredRegion(
        website_id=website.id,
        selector_type=region_in.selector_type,
        selector_value=region_in.selector_value.strip(),
        description=region_in.description,
        is_active=region_in.is_active
    )
    db.add(region)
    await db.commit()
    await db.refresh(region)
    return region


@router.put("/{region_id}", response_model=IgnoredRegionResponse)
async def update_ignored_region(
    region_id: int,
    region_in: IgnoredRegionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates an ignored region selector or toggles its active status.
    """
    result = await db.execute(select(IgnoredRegion).where(IgnoredRegion.id == region_id))
    region = result.scalar_one_or_none()
    if not region:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ignored region not found")

    # Verify ownership
    website = await WebsiteService.get_by_id(db, region.website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    if region_in.selector_type is not None:
        region.selector_type = region_in.selector_type
    if region_in.selector_value is not None:
        region.selector_value = region_in.selector_value.strip()
    if region_in.description is not None:
        region.description = region_in.description
    if region_in.is_active is not None:
        region.is_active = region_in.is_active

    await db.commit()
    await db.refresh(region)
    return region


@router.delete("/{region_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ignored_region(
    region_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes an ignored region selector.
    """
    result = await db.execute(select(IgnoredRegion).where(IgnoredRegion.id == region_id))
    region = result.scalar_one_or_none()
    if not region:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ignored region not found")

    website = await WebsiteService.get_by_id(db, region.website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(region)
    await db.commit()
    return None
