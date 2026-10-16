from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.detected_change import DetectedChange
    from app.models.notification_channel import NotificationChannel


class Notification(Base):
    """
    Log of an attempted or successfully dispatched alert to a notification channel.
    Tracks delivery status, retry errors, and dispatch timestamp.
    """
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    change_id: Mapped[int] = mapped_column(ForeignKey("detected_changes.id", ondelete="CASCADE"), index=True, nullable=False)
    channel_id: Mapped[int] = mapped_column(ForeignKey("notification_channels.id", ondelete="CASCADE"), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True, nullable=False)  # PENDING, SENT, FAILED
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    payload_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    detected_change: Mapped["DetectedChange"] = relationship("DetectedChange", back_populates="notifications")
    channel: Mapped["NotificationChannel"] = relationship("NotificationChannel", back_populates="notifications")
