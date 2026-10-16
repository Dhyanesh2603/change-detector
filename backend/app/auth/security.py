from passlib.context import CryptContext

# Configure password hashing scheme using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a salted bcrypt hash.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generates a secure salted bcrypt hash for a given password.
    """
    return pwd_context.hash(password)
