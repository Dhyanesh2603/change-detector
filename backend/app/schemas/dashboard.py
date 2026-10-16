from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.utils.datetime_utils import UtcDatetime


class StatusCounts(BaseModel):
    total: int = 0
    healthy: int = 0
    changed: int = 0
    failed: int = 0
    checking: int = 0
    pending: int = 0


class ActivityTimelineItem(BaseModel):
    id: int
    website_id: int
    website_name: str
    website_url: str
    event_type: str  # "change_detected", "baseline_established", "check_healthy"
    change_percentage: Optional[float] = None
    summary: Optional[str] = None
    lines_added: Optional[int] = 0
    lines_removed: Optional[int] = 0
    text_preview_added: Optional[List[str]] = None
    text_preview_removed: Optional[List[str]] = None
    tracked_text_snippet: Optional[str] = None
    occurred_at: UtcDatetime


class HealthMetricPoint(BaseModel):
    timestamp: str
    response_time_ms: int
    healthy_count: int
    failed_count: int


class DashboardSummary(BaseModel):
    status_counts: StatusCounts
    total_checks_24h: int = 0
    total_changes_24h: int = 0
    average_response_time_ms: int = 0
    recent_activity: List[ActivityTimelineItem] = []
    health_metrics: List[HealthMetricPoint] = []
