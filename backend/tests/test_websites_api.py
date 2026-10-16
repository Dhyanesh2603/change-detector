import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_api_root_and_health():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "operational"

        health = await ac.get("/api/v1/health")
        assert health.status_code == 200
        assert health.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_auth_registration_and_login_flow():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        email = "dev_engineer@example.com"
        password = "SecurePassword123!"

        # Register
        reg_payload = {"email": email, "password": password, "full_name": "Dev Engineer"}
        reg_res = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert reg_res.status_code in (201, 400)  # 201 or 400 if user exists from prior run

        # Login
        login_payload = {"email": email, "password": password}
        login_res = await ac.post("/api/v1/auth/login", json=login_payload)
        assert login_res.status_code == 200
        token_data = login_res.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

        # Verify Me
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        me_res = await ac.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        assert me_res.json()["email"] == email

        # Create Website
        site_payload = {
            "name": "Example Test Site",
            "url": "https://example.com",
            "check_interval_minutes": 30,
            "ignored_selectors": [".footer-ad"]
        }
        create_site_res = await ac.post("/api/v1/websites", json=site_payload, headers=headers)
        assert create_site_res.status_code == 201
        site_id = create_site_res.json()["id"]

        # List Websites
        list_res = await ac.get("/api/v1/websites", headers=headers)
        assert list_res.status_code == 200
        sites = list_res.json()
        assert any(s["id"] == site_id for s in sites)
