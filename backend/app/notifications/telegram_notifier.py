from typing import Dict, Any, Optional, Tuple
import httpx
from app.notifications.base import NotificationSender
from app.core.config import settings
from app.core.logging import logger


class TelegramNotifier(NotificationSender):
    """
    Dispatches formatted Markdown alerts to Telegram via Bot API.
    Requires bot_token and chat_id in config.
    """

    async def send(self, config: Dict[str, Any], payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        bot_token = config.get("bot_token") or settings.TELEGRAM_DEFAULT_BOT_TOKEN
        chat_id = config.get("chat_id")

        if not bot_token or not chat_id:
            return False, "Telegram bot_token and chat_id are required in channel configuration"

        website_name = payload.get("website_name", "Monitored Website")
        website_url = payload.get("website_url", "")
        summary = payload.get("summary", "Website content changed.")
        change_pct = payload.get("change_percentage", 0.0)
        lines_added = payload.get("lines_added", 0)
        lines_removed = payload.get("lines_removed", 0)

        message_text = (
            f"🔔 *Website Change Detected*\n\n"
            f"*Target:* [{website_name}]({website_url})\n"
            f"*Change:* `{change_pct}%`\n"
            f"*Metrics:* `+{lines_added}` lines added, `-{lines_removed}` removed\n\n"
            f"*Summary:*\n{summary}\n"
        )

        api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        body = {
            "chat_id": chat_id,
            "text": message_text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": False
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(api_url, json=body)
                data = response.json()
                if response.status_code == 200 and data.get("ok"):
                    return True, None
                else:
                    err = data.get("description", response.text)
                    return False, f"Telegram API error: {err}"
        except Exception as e:
            logger.error(f"Failed to post Telegram notification: {e}")
            return False, str(e)
