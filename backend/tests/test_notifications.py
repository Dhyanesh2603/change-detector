import pytest
from app.notifications.email_notifier import EmailNotifier
from app.notifications.discord_notifier import DiscordNotifier
from app.notifications.telegram_notifier import TelegramNotifier
from app.notifications.dispatcher import NotificationDispatcher
from app.models.website import Website
from app.models.detected_change import DetectedChange
from app.models.notification_channel import NotificationChannel
from app.core.database import AsyncSessionLocal, init_db


@pytest.mark.asyncio
async def test_email_notifier_validation():
    notifier = EmailNotifier()
    # Missing email
    success, error = await notifier.send({}, {"website_name": "Test Site"})
    assert not success
    assert "Target recipient email is missing" in (error or "")

    # Simulation mode (when no SMTP credentials configured)
    success, error = await notifier.send(
        {"email": "alert@example.com"},
        {"website_name": "Test Site", "website_url": "https://example.com", "change_percentage": 15.0}
    )
    assert success
    assert error is None


@pytest.mark.asyncio
async def test_discord_notifier_validation():
    notifier = DiscordNotifier()
    # Missing webhook url
    success, error = await notifier.send({}, {"website_name": "Test Site"})
    assert not success
    assert "webhook_url is missing" in (error or "")


@pytest.mark.asyncio
async def test_telegram_notifier_validation():
    notifier = TelegramNotifier()
    # Missing bot_token or chat_id
    success, error = await notifier.send({}, {"website_name": "Test Site"})
    assert not success
    assert "bot_token and chat_id are required" in (error or "")
