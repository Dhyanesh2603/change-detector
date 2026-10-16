from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Tuple


class NotificationSender(ABC):
    """
    Abstract interface for notification channel dispatchers.
    Ensures unified signature across Email, Discord, Telegram, and future webhooks.
    """

    @abstractmethod
    async def send(self, config: Dict[str, Any], payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        """
        Sends an alert for a detected change.
        Returns:
            (success: bool, error_message: Optional[str])
        """
        pass
