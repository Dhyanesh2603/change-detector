from typing import List, TYPE_CHECKING
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.website import Website
    from app.models.notification_channel import NotificationChannel


class User(TimeStampedModel):
    """
    User entity representing registered system users.
    Normalized to 3NF.
    """
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    websites: Mapped[List["Website"]] = relationship(
        "Website",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    notification_channels: Mapped[List["NotificationChannel"]] = relationship(
        "NotificationChannel",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
