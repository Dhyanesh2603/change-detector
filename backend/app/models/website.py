from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimeStampedModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.snapshot import Snapshot
    from app.models.detected_change import DetectedChange
    from app.models.ignored_region import IgnoredRegion


class Website(TimeStampedModel):
    """
    Website entity representing a target URL configured for change monitoring.
    Contains scheduler parameters and current health status.
    """
    __tablename__ = "websites"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), index=True, nullable=False)
    url: Mapped[str] = mapped_column(String(2048), index=True, nullable=False)
    check_interval_minutes: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True, nullable=False)

    # Health status: PENDING, CHECKING, HEALTHY, CHANGED, FAILED
    status: Mapped[str] = mapped_column(String(30), default="PENDING", index=True, nullable=False)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_changed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    last_error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Alert Sensitivity & Filter Rules
    min_change_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    keyword_watchlist: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notify_on_downtime: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="websites")
    ignored_regions: Mapped[List["IgnoredRegion"]] = relationship(
        "IgnoredRegion",
        back_populates="website",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    snapshots: Mapped[List["Snapshot"]] = relationship(
        "Snapshot",
        back_populates="website",
        cascade="all, delete-orphan",
        order_by="desc(Snapshot.created_at)",
        lazy="selectin"
    )
    detected_changes: Mapped[List["DetectedChange"]] = relationship(
        "DetectedChange",
        back_populates="website",
        cascade="all, delete-orphan",
        order_by="desc(DetectedChange.detected_at)",
        lazy="selectin"
    )
