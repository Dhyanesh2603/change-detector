import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notification import Notification
from app.models.notification_channel import NotificationChannel
from app.models.detected_change import DetectedChange
from app.models.website import Website
from app.notifications.email_notifier import EmailNotifier
from app.notifications.discord_notifier import DiscordNotifier
from app.notifications.telegram_notifier import TelegramNotifier
from app.core.logging import logger

SENDERS = {
    "email": EmailNotifier(),
    "discord": DiscordNotifier(),
    "telegram": TelegramNotifier(),
}


class NotificationDispatcher:
    """
    Coordinates delivery of detected change alerts across all active channels
    registered by the website's owner. Records delivery attempts in database.
    """

    @staticmethod
    async def dispatch_change_alert(
        db: AsyncSession,
        website: Website,
        change: DetectedChange,
        summary: str
    ) -> List[Notification]:
        """
        Queries all enabled channels for website.user_id, dispatches notifications,
        and saves audit records.
        """
        # Fetch enabled channels
        result = await db.execute(
            select(NotificationChannel).where(
                NotificationChannel.user_id == website.user_id,
                NotificationChannel.is_enabled == True
            )
        )
        channels = result.scalars().all()

        if not channels:
            logger.info(f"No notification channels enabled for user_id={website.user_id}")
            return []

        payload = {
            "website_id": website.id,
            "website_name": website.name,
            "website_url": website.url,
            "change_id": change.id,
            "change_percentage": change.change_percentage,
            "lines_added": change.lines_added,
            "lines_removed": change.lines_removed,
            "summary": summary,
        }

        notification_records: List[Notification] = []

        for channel in channels:
            sender = SENDERS.get(channel.channel_type.lower())
            if not sender:
                logger.warning(f"Unsupported notification channel type: {channel.channel_type}")
                continue

            try:
                config_dict = json.loads(channel.config_json) if channel.config_json else {}
            except Exception:
                config_dict = {}

            # Execute dispatch
            success, error_msg = await sender.send(config_dict, payload)

            notif = Notification(
                change_id=change.id,
                channel_id=channel.id,
                status="SENT" if success else "FAILED",
                sent_at=datetime.now(timezone.utc) if success else None,
                error_message=error_msg,
                payload_json=json.dumps(payload)
            )
            db.add(notif)
            notification_records.append(notif)

        await db.commit()
        return notification_records

    @staticmethod
    async def dispatch_suppressed_alert(
        db: AsyncSession,
        website: Website,
        change: DetectedChange,
        reason: str
    ) -> List[Notification]:
        """
        Creates audit log records marked as SUPPRESSED when alert rules
        (minimum sensitivity threshold or keyword watchlists) suppress notification dispatch.
        """
        result = await db.execute(
            select(NotificationChannel).where(
                NotificationChannel.user_id == website.user_id,
                NotificationChannel.is_enabled == True
            )
        )
        channels = result.scalars().all()
        if not channels:
            return []

        records: List[Notification] = []
        payload = {
            "website_id": website.id,
            "website_name": website.name,
            "website_url": website.url,
            "change_id": change.id,
            "change_percentage": change.change_percentage,
            "suppression_reason": reason,
        }

        for channel in channels:
            notif = Notification(
                change_id=change.id,
                channel_id=channel.id,
                status="SUPPRESSED",
                sent_at=None,
                error_message=f"Suppressed: {reason}",
                payload_json=json.dumps(payload)
            )
            db.add(notif)
            records.append(notif)

        await db.commit()
        return records
