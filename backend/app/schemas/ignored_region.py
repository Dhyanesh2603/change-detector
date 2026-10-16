from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict
from app.utils.datetime_utils import UtcDatetime


class IgnoredRegionBase(BaseModel):
    selector_type: str = Field("css", description="Selector type: 'css', 'xpath', 'tag'")
    selector_value: str = Field(..., description="Selector query string (e.g. '.timestamp', 'footer')")
    description: Optional[str] = Field(None, description="Optional purpose of ignored region")
    is_active: bool = True


class IgnoredRegionCreate(IgnoredRegionBase):
    pass


class IgnoredRegionUpdate(BaseModel):
    selector_type: Optional[str] = None
    selector_value: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class IgnoredRegionResponse(IgnoredRegionBase):
    id: int
    website_id: int
    created_at: UtcDatetime

    model_config = ConfigDict(from_attributes=True)
