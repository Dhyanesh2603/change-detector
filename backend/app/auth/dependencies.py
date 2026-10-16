from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.user import User
from app.auth.jwt_handler import decode_token

# Optional HTTPBearer allows either Authorization header OR HttpOnly cookie
security_bearer = HTTPBearer(auto_error=False)


async def get_token_from_request(
    request: Request,
    bearer_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Optional[str]:
    """
    Extracts access token from Authorization header or 'access_token' cookie.
    Enables dual support for standard API clients and secure browser cookie workflows.
    """
    if bearer_header and bearer_header.credentials:
        return bearer_header.credentials
    # Fallback to HttpOnly cookie
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token
    return None


async def get_current_user(
    token: Optional[str] = Depends(get_token_from_request),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Resolves the authenticated user from the validated JWT token.
    Raises 401 UNAUTHORIZED if token is missing, invalid, or expired.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    payload = decode_token(token)
    if not payload or not payload.sub or payload.type != "access":
        raise credentials_exception

    try:
        user_id = int(payload.sub)
    except ValueError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception

    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Ensures user account is active.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Ensures user has superuser privileges.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    return current_user
