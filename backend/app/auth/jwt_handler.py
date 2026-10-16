from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
from app.core.config import settings
from app.schemas.auth import TokenPayload


def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    """
    Issues a short-lived JSON Web Token for authenticated API access.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    """
    Issues a long-lived JSON Web Token used exclusively to refresh expired access tokens.
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode: Dict[str, Any] = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[TokenPayload]:
    """
    Decodes and validates token signature, expiration, and claims.
    Returns TokenPayload or None if invalid.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        token_data = TokenPayload(
            sub=payload.get("sub"),
            exp=payload.get("exp"),
            type=payload.get("type")
        )
        return token_data
    except (jwt.PyJWTError, ValueError):
        return None
