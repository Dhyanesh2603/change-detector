from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.notification import Notification


class NotificationChannel(Base):
    """
    User-configured destination for alerts (Email, Discord Webhook, Telegram Bot).
    Sensitive configuration (token, webhook URL) stored in JSON text.
    """
    __tablename__ = "notification_channels"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    channel_type: Mapped[str] = mapped_column(String(30), nullable=False)  # email, discord, telegram
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    config_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notification_channels")
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="channel",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
