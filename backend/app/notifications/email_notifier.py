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
    Supports STARTTLS (port 587) and direct SSL (port 465).
    """

    async def send(self, config: Dict[str, Any], payload: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        to_email = config.get("email") or config.get("to_email")
        if not to_email:
            return False, "Target recipient email is missing in channel configuration"

        host = config.get("smtp_host") or settings.SMTP_HOST or "smtp.gmail.com"
        port_val = config.get("smtp_port") or settings.SMTP_PORT or 587
        try:
            port = int(port_val)
        except (ValueError, TypeError):
            port = 587

        user = (config.get("smtp_user") or settings.SMTP_USER or "").strip()
        password = (config.get("smtp_password") or settings.SMTP_PASSWORD or "").strip()
        use_tls = config.get("use_tls", settings.SMTP_USE_TLS)

        # Sender address: if not explicitly configured, default to authenticated user email or fallback
        from_email = (
            config.get("from_email")
            or (user if user and "@" in user else settings.SMTP_FROM_EMAIL)
        )

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
                err_msg = (
                    "SMTP credentials not configured. Please provide SMTP Username & App Password "
                    "in the channel settings or configure SMTP_USER & SMTP_PASSWORD in server environment variables. "
                    "(For Gmail, use a 16-character Google App Password)."
                )
                logger.warning(f"[Email Dispatch Blocked] {err_msg}")
                return False, err_msg

            server = None
            try:
                if port == 465:
                    server = smtplib.SMTP_SSL(host, port, timeout=15)
                else:
                    server = smtplib.SMTP(host, port, timeout=15)
                    if use_tls:
                        server.starttls()

                server.login(user, password)
                server.send_message(msg)
                logger.info(f"Successfully dispatched change notification email to {to_email}")
                return True, None
            except smtplib.SMTPAuthenticationError as auth_err:
                err_text = (
                    f"SMTP Authentication failed for user '{user}'. Please verify your username and password. "
                    "For Gmail: Enable 2-Step Verification and use a 16-character App Password "
                    "(Google Account > Security > 2-Step Verification > App Passwords), not your normal account password."
                )
                logger.error(f"{err_text} Details: {auth_err}")
                return False, err_text
            except (smtplib.SMTPConnectError, TimeoutError, OSError) as conn_err:
                err_text = f"Could not connect to SMTP server {host}:{port}. Network/firewall error: {conn_err}"
                logger.error(err_text)
                return False, err_text
            except Exception as exc:
                logger.error(f"Failed to dispatch email: {exc}")
                return False, str(exc)
            finally:
                if server:
                    try:
                        server.quit()
                    except Exception:
                        pass

        try:
            return await anyio.to_thread.run_sync(_send)
        except Exception as e:
            logger.error(f"Failed to dispatch email thread: {e}")
            return False, str(e)
