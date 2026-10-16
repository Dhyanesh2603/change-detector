from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import Float, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.website import Website
    from app.models.snapshot import Snapshot
    from app.models.notification import Notification


class DetectedChange(Base):
    """
    Records a detected difference between two snapshots of a monitored website.
    Stores semantic metrics: change percentage, added/removed lines, human-readable summary,
    and storage path to detailed structured diff json.
    """
    __tablename__ = "detected_changes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    website_id: Mapped[int] = mapped_column(ForeignKey("websites.id", ondelete="CASCADE"), index=True, nullable=False)
    previous_snapshot_id: Mapped[Optional[int]] = mapped_column(ForeignKey("snapshots.id", ondelete="SET NULL"), nullable=True)
    current_snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id", ondelete="CASCADE"), nullable=False)

    change_percentage: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    lines_added: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    lines_removed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    diff_data_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False
    )

    # Relationships
    website: Mapped["Website"] = relationship("Website", back_populates="detected_changes")
    previous_snapshot: Mapped[Optional["Snapshot"]] = relationship(
        "Snapshot",
        foreign_keys=[previous_snapshot_id]
    )
    current_snapshot: Mapped["Snapshot"] = relationship(
        "Snapshot",
        foreign_keys=[current_snapshot_id]
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="detected_change",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
