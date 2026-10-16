from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, HttpUrl, Field, ConfigDict
from app.utils.datetime_utils import UtcDatetime
from app.schemas.ignored_region import IgnoredRegionResponse
from app.schemas.snapshot import SnapshotResponse
from app.schemas.detected_change import DetectedChangeResponse


class WebsiteBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    url: str = Field(..., max_length=2048)
    check_interval_minutes: int = Field(60, ge=1, le=10080, description="Check frequency in minutes")
    is_active: bool = True
    min_change_percentage: float = Field(0.0, ge=0.0, le=100.0, description="Minimum change % threshold to trigger alerts")
    keyword_watchlist: Optional[str] = Field(None, description="Comma-separated trigger keywords")
    notify_on_downtime: bool = True


class WebsiteCreate(WebsiteBase):
    ignored_selectors: Optional[List[str]] = Field(default_factory=list, description="Optional initial CSS selectors to ignore")


class WebsiteUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    url: Optional[str] = Field(None, max_length=2048)
    check_interval_minutes: Optional[int] = Field(None, ge=1, le=10080)
    is_active: Optional[bool] = None
    min_change_percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    keyword_watchlist: Optional[str] = None
    notify_on_downtime: Optional[bool] = None


class WebsiteResponse(WebsiteBase):
    id: int
    user_id: int
    status: str
    last_checked_at: Optional[UtcDatetime] = None
    last_changed_at: Optional[UtcDatetime] = None
    last_status_code: Optional[int] = None
    last_error_message: Optional[str] = None
    created_at: UtcDatetime
    updated_at: Optional[UtcDatetime] = None

    model_config = ConfigDict(from_attributes=True)


class WebsiteDetailResponse(WebsiteResponse):
    ignored_regions: List[IgnoredRegionResponse] = []
    recent_snapshots: List[SnapshotResponse] = []
    recent_changes: List[DetectedChangeResponse] = []
