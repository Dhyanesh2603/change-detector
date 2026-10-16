from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.user import User
from app.schemas.detected_change import DetectedChangeResponse, DetectedChangeDetail
from app.services.change_service import ChangeService
from app.services.website_service import WebsiteService
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/changes", tags=["Changes"])


@router.get("/website/{website_id}", response_model=List[DetectedChangeResponse])
async def list_changes_for_website(
    website_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists detected change records for a monitored website.
    """
    website = await WebsiteService.get_by_id(db, website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    changes = await ChangeService.get_by_website(db, website_id, limit=limit)
    return changes


@router.get("/recent", response_model=List[DetectedChangeResponse])
async def list_recent_changes_for_user(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists recent detected changes across all websites monitored by current user.
    """
    changes = await ChangeService.get_recent_by_user(db, current_user.id, limit=limit)
    return changes


@router.get("/{change_id}", response_model=DetectedChangeDetail)
async def get_change_detail(
    change_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves complete change metrics and structured diff JSON (side-by-side lines, opcodes).
    """
    change = await ChangeService.get_by_id(db, change_id)
    if not change:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Detected change record not found")

    # Verify user ownership
    website = await WebsiteService.get_by_id(db, change.website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    diff_payload = await ChangeService.get_change_diff_payload(change)

    detail = DetectedChangeDetail(
        id=change.id,
        website_id=change.website_id,
        previous_snapshot_id=change.previous_snapshot_id,
        current_snapshot_id=change.current_snapshot_id,
        change_percentage=change.change_percentage,
        lines_added=change.lines_added,
        lines_removed=change.lines_removed,
        summary=change.summary,
        diff_data_path=change.diff_data_path,
        detected_at=change.detected_at,
        previous_snapshot=change.previous_snapshot,
        current_snapshot=change.current_snapshot,
        diff_details=diff_payload
    )
    return detail
