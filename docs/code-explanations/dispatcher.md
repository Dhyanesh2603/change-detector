# Code Explanation: `dispatcher.py`

## Matching Source File
`backend/app/notifications/dispatcher.py`

---

## 1. Purpose
Coordinates notification delivery when a website change is detected, routing alerts to all configured channels (Email, Discord, Telegram) and logging audit trails in the database.

---

## 2. Responsibilities
- Querying enabled `NotificationChannel` records for the owner of the changed website.
- Parsing configuration JSON (webhook URLs, chat IDs, bot tokens, recipient emails).
- Mapping channel types to corresponding `NotificationSender` instances (`EmailNotifier`, `DiscordNotifier`, `TelegramNotifier`).
- Dispatching alerts concurrently.
- Creating and committing `Notification` records with delivery status (`SENT` / `FAILED`) and diagnostic error strings.

---

## 3. Main Classes
- `NotificationDispatcher`: Static orchestration coordinator for alert routing.

---

## 4. Main Functions
- `dispatch_change_alert(db: AsyncSession, website: Website, change: DetectedChange, summary: str) -> List[Notification]`

---

## 5. Execution Flow
1. Queries `NotificationChannel` where `user_id == website.user_id` and `is_enabled == True`.
2. Assembles notification payload (website name, url, change %, lines added/removed, summary).
3. Iterates through channels:
   - Selects sender from `SENDERS` registry (`email`, `discord`, `telegram`).
   - Awaits `sender.send(config, payload)`.
   - Records status, sent timestamp, and error message in `Notification` entity.
4. Commits all audit records in one database transaction.
5. Returns list of notification records.

---

## 6. Dependencies
- `sqlalchemy.ext.asyncio.AsyncSession`: Database session.
- `app.models.*`: `Notification`, `NotificationChannel`, `DetectedChange`, `Website`.
- `app.notifications.*`: `EmailNotifier`, `DiscordNotifier`, `TelegramNotifier`.

---

## 7. Interview Explanation
> *"NotificationDispatcher follows the Open/Closed Principle. Adding a new alert destination (such as Slack Webhooks or PagerDuty) simply requires implementing the `NotificationSender` interface and registering it in the `SENDERS` dictionary without modifying existing dispatch logic."*

---

## 8. Common Modifications
- Adding retry queues or exponential backoff workers for failed webhook notifications.
