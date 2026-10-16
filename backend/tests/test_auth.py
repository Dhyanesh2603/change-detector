import pytest
from app.auth.security import get_password_hash, verify_password
from app.auth.jwt_handler import create_access_token, create_refresh_token, decode_token


def test_password_hashing():
    raw = "SuperSecretPass123"
    hashed = get_password_hash(raw)

    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_token_flow():
    user_id = 42
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)

    decoded_access = decode_token(access)
    assert decoded_access is not None
    assert decoded_access.sub == "42"
    assert decoded_access.type == "access"

    decoded_refresh = decode_token(refresh)
    assert decoded_refresh is not None
    assert decoded_refresh.sub == "42"
    assert decoded_refresh.type == "refresh"


def test_invalid_token():
    decoded = decode_token("invalid.token.string")
    assert decoded is None
