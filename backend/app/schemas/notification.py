from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.utils.datetime_utils import UtcDatetime


class NotificationChannelBase(BaseModel):
    channel_type: str = Field(..., description="'email', 'discord', 'telegram'")
    name: str = Field(..., max_length=100)
    config: Dict[str, Any] = Field(default_factory=dict)
    is_enabled: bool = True


class NotificationChannelCreate(NotificationChannelBase):
    pass


class NotificationChannelUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    is_enabled: Optional[bool] = None


class NotificationChannelResponse(NotificationChannelBase):
    id: int
    user_id: int
    created_at: UtcDatetime

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    id: int
    change_id: int
    channel_id: int
    status: str
    sent_at: Optional[UtcDatetime] = None
    error_message: Optional[str] = None
    created_at: UtcDatetime

    model_config = ConfigDict(from_attributes=True)
