import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.user import User
from app.models.notification_channel import NotificationChannel
from app.models.notification import Notification
from app.schemas.notification import (
    NotificationChannelCreate,
    NotificationChannelUpdate,
    NotificationChannelResponse,
    NotificationResponse,
)
from app.notifications.dispatcher import SENDERS
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/channels", response_model=List[NotificationChannelResponse])
async def list_notification_channels(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Lists configured alert channels (Email, Discord, Telegram) for current user.
    """
    result = await db.execute(
        select(NotificationChannel)
        .where(NotificationChannel.user_id == current_user.id)
        .order_by(desc(NotificationChannel.created_at))
    )
    channels = result.scalars().all()

    resp: List[NotificationChannelResponse] = []
    for ch in channels:
        cfg = json.loads(ch.config_json) if ch.config_json else {}
        resp.append(NotificationChannelResponse(
            id=ch.id,
            user_id=ch.user_id,
            channel_type=ch.channel_type,
            name=ch.name,
            config=cfg,
            is_enabled=ch.is_enabled,
            created_at=ch.created_at
        ))
    return resp


@router.post("/channels", response_model=NotificationChannelResponse, status_code=status.HTTP_201_CREATED)
async def create_notification_channel(
    channel_in: NotificationChannelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Registers a new alert channel for notifications.
    """
    channel_type = channel_in.channel_type.lower()
    if channel_type not in ("email", "discord", "telegram"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported channel type. Supported: 'email', 'discord', 'telegram'"
        )

    channel = NotificationChannel(
        user_id=current_user.id,
        channel_type=channel_type,
        name=channel_in.name.strip(),
        config_json=json.dumps(channel_in.config),
        is_enabled=channel_in.is_enabled
    )
    db.add(channel)
    await db.commit()
    await db.refresh(channel)

    return NotificationChannelResponse(
        id=channel.id,
        user_id=channel.user_id,
        channel_type=channel.channel_type,
        name=channel.name,
        config=channel_in.config,
        is_enabled=channel.is_enabled,
        created_at=channel.created_at
    )


@router.put("/channels/{channel_id}", response_model=NotificationChannelResponse)
async def update_notification_channel(
    channel_id: int,
    channel_in: NotificationChannelUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Updates an alert channel's name, configuration, or active state.
    """
    result = await db.execute(
        select(NotificationChannel).where(
            NotificationChannel.id == channel_id,
            NotificationChannel.user_id == current_user.id
        )
    )
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    if channel_in.name is not None:
        channel.name = channel_in.name.strip()
    if channel_in.config is not None:
        channel.config_json = json.dumps(channel_in.config)
    if channel_in.is_enabled is not None:
        channel.is_enabled = channel_in.is_enabled

    await db.commit()
    await db.refresh(channel)

    cfg = json.loads(channel.config_json) if channel.config_json else {}
    return NotificationChannelResponse(
        id=channel.id,
        user_id=channel.user_id,
        channel_type=channel.channel_type,
        name=channel.name,
        config=cfg,
        is_enabled=channel.is_enabled,
        created_at=channel.created_at
    )


@router.delete("/channels/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification_channel(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Deletes a notification channel.
    """
    result = await db.execute(
        select(NotificationChannel).where(
            NotificationChannel.id == channel_id,
            NotificationChannel.user_id == current_user.id
        )
    )
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    await db.delete(channel)
    await db.commit()
    return None


@router.post("/channels/{channel_id}/test")
async def test_notification_channel(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Dispatches an immediate diagnostic test message to verify credentials and reachability.
    """
    result = await db.execute(
        select(NotificationChannel).where(
            NotificationChannel.id == channel_id,
            NotificationChannel.user_id == current_user.id
        )
    )
    channel = result.scalar_one_or_none()
    if not channel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Channel not found")

    sender = SENDERS.get(channel.channel_type.lower())
    if not sender:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported channel type")

    cfg = json.loads(channel.config_json) if channel.config_json else {}
    test_payload = {
        "website_name": "Test Target (Change Detector)",
        "website_url": "https://example.com",
        "change_percentage": 12.5,
        "lines_added": 4,
        "lines_removed": 1,
        "summary": "This is a diagnostic test alert sent from Website Change Detector."
    }

    success, error_msg = await sender.send(cfg, test_payload)
    if success:
        return {"success": True, "message": "Test alert dispatched successfully!"}
    else:
        return {"success": False, "error": error_msg}


@router.get("/logs", response_model=List[NotificationResponse])
async def list_notification_logs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves history of dispatched notification alerts and delivery statuses.
    """
    result = await db.execute(
        select(Notification)
        .join(NotificationChannel, NotificationChannel.id == Notification.channel_id)
        .where(NotificationChannel.user_id == current_user.id)
        .order_by(desc(Notification.created_at))
        .limit(limit)
    )
    return list(result.scalars().all())
