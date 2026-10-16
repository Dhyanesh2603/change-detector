from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.user import User
from app.schemas.snapshot import SnapshotResponse, SnapshotDetail
from app.services.snapshot_service import SnapshotService
from app.services.website_service import WebsiteService
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/snapshots", tags=["Snapshots"])


@router.get("/website/{website_id}", response_model=List[SnapshotResponse])
async def list_snapshots_for_website(
    website_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists snapshots for a specific website owned by the current user.
    """
    website = await WebsiteService.get_by_id(db, website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Website not found")

    snapshots = await SnapshotService.get_by_website(db, website_id, limit=limit)
    return snapshots


@router.get("/{snapshot_id}", response_model=SnapshotDetail)
async def get_snapshot_detail(
    snapshot_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves full snapshot detail, including stored sanitized HTML and normalized text.
    """
    snapshot = await SnapshotService.get_by_id(db, snapshot_id)
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")

    # Verify ownership
    website = await WebsiteService.get_by_id(db, snapshot.website_id, current_user.id)
    if not website:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    content = await SnapshotService.get_snapshot_content(snapshot)

    detail = SnapshotDetail(
        id=snapshot.id,
        website_id=snapshot.website_id,
        content_hash=snapshot.content_hash,
        page_title=snapshot.page_title,
        http_status=snapshot.http_status,
        response_time_ms=snapshot.response_time_ms,
        text_length=snapshot.text_length,
        raw_html_path=snapshot.raw_html_path,
        normalized_text_path=snapshot.normalized_text_path,
        screenshot_path=snapshot.screenshot_path,
        created_at=snapshot.created_at,
        raw_html=content["raw_html"],
        normalized_text=content["normalized_text"]
    )
    return detail
