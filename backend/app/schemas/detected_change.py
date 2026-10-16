from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict
from app.utils.datetime_utils import UtcDatetime
from app.schemas.snapshot import SnapshotResponse


class DetectedChangeBase(BaseModel):
    website_id: int
    previous_snapshot_id: Optional[int] = None
    current_snapshot_id: int
    change_percentage: float = 0.0
    lines_added: int = 0
    lines_removed: int = 0
    summary: Optional[str] = None


class DetectedChangeResponse(DetectedChangeBase):
    id: int
    diff_data_path: Optional[str] = None
    detected_at: UtcDatetime
    previous_snapshot: Optional[SnapshotResponse] = None
    current_snapshot: Optional[SnapshotResponse] = None

    model_config = ConfigDict(from_attributes=True)


class DetectedChangeDetail(DetectedChangeResponse):
    diff_details: Optional[Dict[str, Any]] = None
