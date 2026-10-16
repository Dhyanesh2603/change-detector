import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Dict, Any, Optional, Tuple
import anyio
from app.notifications.base import NotificationSender
from app.core.config import settings
from app.core.logging import logger


class EmailNotifier(NotificationSender):
    """
    SMTP Email notification dispatcher with plain-text and HTML support.
    """

    async def send(self, config: Dict[str, Any], payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        to_email = config.get("email") or config.get("to_email")
        if not to_email:
            return False, "Target recipient email is missing in channel configuration"

        host = config.get("smtp_host") or settings.SMTP_HOST
        port = int(config.get("smtp_port") or settings.SMTP_PORT)
        user = config.get("smtp_user") or settings.SMTP_USER
        password = config.get("smtp_password") or settings.SMTP_PASSWORD
        from_email = config.get("from_email") or settings.SMTP_FROM_EMAIL
        use_tls = config.get("use_tls", settings.SMTP_USE_TLS)

        website_name = payload.get("website_name", "Monitored Website")
        website_url = payload.get("website_url", "")
        summary = payload.get("summary", "Changes were detected.")
        change_pct = payload.get("change_percentage", 0.0)
        lines_added = payload.get("lines_added", 0)
        lines_removed = payload.get("lines_removed", 0)

        subject = f"[Alert] Changes detected on {website_name} ({change_pct}%)"

        plain_body = f"""Website Change Alert

Website: {website_name} ({website_url})
Change Percentage: {change_pct}%
Added Lines: {lines_added}
Removed Lines: {lines_removed}

Summary:
{summary}

View full diff on your dashboard.
"""

        html_body = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 6px; background-color: #ffffff;">
            <h2 style="margin-top: 0; color: #111827; font-size: 18px; border-bottom: 1px solid #e5e7eb; padding-bottom: 12px;">Website Change Alert</h2>
            <p style="color: #4b5563; font-size: 14px; margin: 8px 0;"><strong>Target:</strong> <a href="{website_url}" style="color: #2563eb; text-decoration: none;">{website_name}</a></p>
            <div style="display: flex; gap: 12px; margin: 16px 0; background-color: #f9fafb; padding: 12px; border-radius: 4px; border: 1px solid #f3f4f6;">
                <div style="font-size: 13px; color: #374151;"><strong>Change:</strong> {change_pct}%</div>
                <div style="font-size: 13px; color: #16a34a; margin-left: 12px;"><strong>+{lines_added}</strong> added</div>
                <div style="font-size: 13px; color: #dc2626; margin-left: 12px;"><strong>-{lines_removed}</strong> removed</div>
            </div>
            <p style="color: #1f2937; font-size: 14px; background: #f8fafc; padding: 12px; border-left: 3px solid #3b82f6; margin: 16px 0;">
                {summary}
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; border-top: 1px solid #f3f4f6; padding-top: 12px;">
                Generated automatically by Website Change Detector.
            </p>
        </div>
        """

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email
        msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        def _send():
            if not user or not password:
                # If credentials not provided in local dev, log simulation
                logger.info(f"[Email Simulation] Would send alert to {to_email}: {subject}")
                return True, None

            server = smtplib.SMTP(host, port, timeout=10)
            try:
                if use_tls:
                    server.starttls()
                server.login(user, password)
                server.send_message(msg)
                return True, None
            finally:
                server.quit()

        try:
            return await anyio.to_thread.run_sync(_send)
        except Exception as e:
            logger.error(f"Failed to dispatch email: {e}")
            return False, str(e)
