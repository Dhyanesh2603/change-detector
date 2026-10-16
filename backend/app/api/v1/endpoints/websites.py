import asyncio
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.website import Website
from app.schemas.website import (
    WebsiteCreate,
    WebsiteUpdate,
    WebsiteResponse,
    WebsiteDetailResponse,
)
from app.schemas.snapshot import SnapshotResponse
from app.schemas.detected_change import DetectedChangeResponse
from app.schemas.ignored_region import IgnoredRegionResponse
from app.services.website_service import WebsiteService
from app.services.monitor_service import MonitorService
from app.auth.dependencies import get_current_active_user
from app.core.logging import logger

router = APIRouter(prefix="/websites", tags=["Websites"])


async def _run_background_check(website_id: int):
    async with AsyncSessionLocal() as db:
        try:
            await MonitorService.execute_check(db, website_id)
        except Exception as e:
            logger.error(f"Background check error for website {website_id}: {e}")


@router.get("", response_model=List[WebsiteResponse])
async def list_websites(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves all monitored websites owned by current user.
    """
    websites = await WebsiteService.get_all_by_user(db, current_user.id)
    return websites


@router.post("", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED)
async def create_website(
    website_in: WebsiteCreate,
    background_tasks: BackgroundTasks,
    sync: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Creates a new monitored target URL and automatically queues or executes the initial baseline snapshot.
    """
    # Clean URL format and support GitHub repo shorthand (e.g. "facebook/react")
    url_str = str(website_in.url).strip()
    if not (url_str.startswith("http://") or url_str.startswith("https://")):
        if "/" in url_str and not url_str.startswith("www.") and " " not in url_str:
            url_str = f"https://github.com/{url_str}"
        else:
            url_str = "https://" + url_str
    website_in.url = url_str

    website = await WebsiteService.create(db, current_user.id, website_in)

    # Immediately execute or queue initial baseline capture
    if sync:
        try:
            await MonitorService.execute_check(db, website.id)
        except Exception as e:
            logger.error(f"Sync check failed on website create: {e}")
        try:
            await db.refresh(website)
        except Exception:
            pass
    else:
        background_tasks.add_task(_run_background_check, website.id)

    return website


@router.get("/{website_id}", response_model=WebsiteDetailResponse)
async def get_website(
    website_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves website details, including active ignored regions, recent snapshots, and change log.
    """
    website = await WebsiteService.get_by_id(db, website_id, current_user.id)
    if not website:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitored website not found"
        )

    # Convert relationships to responses
    detail = WebsiteDetailResponse(
        id=website.id,
        user_id=website.user_id,
        name=website.name,
        url=website.url,
        check_interval_minutes=website.check_interval_minutes,
        is_active=website.is_active,
        status=website.status,
        last_checked_at=website.last_checked_at,
        last_changed_at=website.last_changed_at,
        last_status_code=website.last_status_code,
        last_error_message=website.last_error_message,
        created_at=website.created_at,
        updated_at=website.updated_at,
        ignored_regions=[IgnoredRegionResponse.model_validate(r) for r in website.ignored_regions],
        recent_snapshots=[SnapshotResponse.model_validate(s) for s in website.snapshots[:20]],
        recent_changes=[DetectedChangeResponse.model_validate(c) for c in website.detected_changes[:20]]
    )
    return detail


@router.put("/{website_id}", response_model=WebsiteResponse)
async def update_website(
    website_id: int,
    website_in: WebsiteUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates monitored website parameters (name, interval, active toggle).
    """
    website = await WebsiteService.get_by_id(db, website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    updated = await WebsiteService.update(db, website, website_in)
    return updated


@router.delete("/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_website(
    website_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes a monitored website and cascades deletion to all associated snapshots and changes.
    """
    website = await WebsiteService.get_by_id(db, website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    await WebsiteService.delete(db, website)
    return None


@router.post("/{website_id}/check")
async def trigger_manual_check(
    website_id: int,
    background_tasks: BackgroundTasks,
    sync: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Triggers an immediate on-demand check.
    If sync=True, waits for the check to complete and returns the diff result.
    If sync=False (default), queues in background and returns immediately.
    """
    website = await WebsiteService.get_by_id(db, website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    if sync:
        result = await MonitorService.execute_check(db, website.id)
        return {"message": "Check completed", "result": result}
    else:
        background_tasks.add_task(_run_background_check, website.id)
        return {"message": "Monitoring check queued successfully", "website_id": website.id}


@router.post("/{website_id}/simulate-change")
async def simulate_website_change(
    website_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Simulates a content change on the target website.
    Runs DiffEngine, generates side-by-side text diff, records DetectedChange, and dispatches alerts.
    """
    website = await WebsiteService.get_by_id(db, website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    result = await MonitorService.simulate_change(db, website.id)
    return result
