from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate
from app.auth.security import get_password_hash, verify_password


class UserService:
    """
    Manages user registration, credential verification, and account lookups.
    """

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_email(db: AsyncSession, email: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email.lower().strip()))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, user_in: UserCreate) -> User:
        hashed_pw = get_password_hash(user_in.password)
        db_user = User(
            email=user_in.email.lower().strip(),
            hashed_password=hashed_pw,
            full_name=user_in.full_name,
            is_active=True,
            is_superuser=False
        )
        db.add(db_user)
        await db.commit()
        await db.refresh(db_user)
        return db_user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> Optional[User]:
        user = await UserService.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
