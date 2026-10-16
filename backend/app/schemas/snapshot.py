from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.utils.datetime_utils import UtcDatetime


class SnapshotBase(BaseModel):
    website_id: int
    content_hash: str
    page_title: Optional[str] = None
    http_status: int = 200
    response_time_ms: int = 0
    text_length: int = 0


class SnapshotResponse(SnapshotBase):
    id: int
    raw_html_path: Optional[str] = None
    normalized_text_path: Optional[str] = None
    screenshot_path: Optional[str] = None
    created_at: UtcDatetime

    model_config = ConfigDict(from_attributes=True)


class SnapshotDetail(SnapshotResponse):
    raw_html: Optional[str] = None
    normalized_text: Optional[str] = None
