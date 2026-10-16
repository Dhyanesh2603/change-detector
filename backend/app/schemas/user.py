from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.utils.datetime_utils import UtcDatetime


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: int
    is_superuser: bool
    created_at: UtcDatetime
    updated_at: Optional[UtcDatetime] = None

    model_config = ConfigDict(from_attributes=True)
