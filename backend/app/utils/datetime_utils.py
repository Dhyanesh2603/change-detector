from datetime import datetime, timezone
from typing import Optional, Annotated
from pydantic import PlainSerializer


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """
    Ensures a datetime object is timezone-aware in UTC.
    Fixes SQLite compatibility where datetimes are returned as offset-naive strings.
    """
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def serialize_utc(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    utc_dt = ensure_utc(dt)
    return utc_dt.isoformat()


# Pydantic v2 type that guarantees UTC timezone offset is appended when serialized to JSON
UtcDatetime = Annotated[datetime, PlainSerializer(serialize_utc, return_type=str, when_used="json")]
