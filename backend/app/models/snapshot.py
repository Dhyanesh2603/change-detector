from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.website import Website


class Snapshot(Base):
    """
    Represents an immutable snapshot of a website at a specific point in time.
    Stores metadata, semantic hash, and relative paths to stored HTML, text, and screenshot.
    Only created when initial baseline is established or meaningful change is detected.
    """
    __tablename__ = "snapshots"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    website_id: Mapped[int] = mapped_column(ForeignKey("websites.id", ondelete="CASCADE"), index=True, nullable=False)
    content_hash: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    page_title: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    raw_html_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    normalized_text_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    screenshot_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    http_status: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    response_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    text_length: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
        nullable=False
    )

    # Relationships
    website: Mapped["Website"] = relationship("Website", back_populates="snapshots")
