from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from app.models.website import Website


class IgnoredRegion(Base):
    """
    Defines a dynamic noise region to ignore before hash calculation and diffing.
    Examples: CSS selectors (.timestamp, #ad-banner), XPath, or tags (header, footer).
    """
    __tablename__ = "ignored_regions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True, autoincrement=True)
    website_id: Mapped[int] = mapped_column(ForeignKey("websites.id", ondelete="CASCADE"), index=True, nullable=False)
    selector_type: Mapped[str] = mapped_column(String(20), default="css", nullable=False)  # css, xpath, tag
    selector_value: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    website: Mapped["Website"] = relationship("Website", back_populates="ignored_regions")
