from typing import Dict, Any, Optional, Tuple
import httpx
from app.notifications.base import NotificationSender
from app.core.logging import logger


class DiscordNotifier(NotificationSender):
    """
    Dispatches rich webhook cards to Discord channels with metrics,
    summary, and status color codes.
    """

    async def send(self, config: Dict[str, Any], payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        webhook_url = config.get("webhook_url")
        if not webhook_url:
            return False, "Discord webhook_url is missing from channel configuration"

        website_name = payload.get("website_name", "Target Website")
        website_url = payload.get("website_url", "")
        summary = payload.get("summary", "Website content changed.")
        change_pct = payload.get("change_percentage", 0.0)
        lines_added = payload.get("lines_added", 0)
        lines_removed = payload.get("lines_removed", 0)

        # Discord embed color: Amber (16753920) or Emerald/Green (3066993)
        embed_color = 16753920 if change_pct < 20 else 15158332

        discord_payload = {
            "username": "Change Detector Bot",
            "avatar_url": "https://img.icons8.com/color/96/change-management.png",
            "embeds": [
                {
                    "title": f"Website Change Detected: {website_name}",
                    "url": website_url,
                    "description": summary,
                    "color": embed_color,
                    "fields": [
                        {"name": "Change %", "value": f"{change_pct}%", "inline": True},
                        {"name": "Lines Added", "value": f"+{lines_added}", "inline": True},
                        {"name": "Lines Removed", "value": f"-{lines_removed}", "inline": True},
                        {"name": "Target URL", "value": website_url, "inline": False}
                    ],
                    "footer": {
                        "text": "Website Change Detection Platform • Developer Notification"
                    }
                }
            ]
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(webhook_url, json=discord_payload)
                if response.status_code in (200, 204):
                    return True, None
                else:
                    return False, f"Discord API responded with status {response.status_code}: {response.text}"
        except Exception as e:
            logger.error(f"Failed to post Discord webhook: {e}")
            return False, str(e)
