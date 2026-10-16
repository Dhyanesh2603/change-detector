# RESTful API Specification (v1)

## Overview

The **Website Change Detection Platform** provides a structured, developer-first RESTful API at `/api/v1`.
It supports both **Bearer Token** authorization headers for programmatic API scripts and **HttpOnly Cookies** for secure web browser SPA workflows.

Interactive Swagger documentation is served at `/docs` and ReDoc at `/redoc`.

---

## 1. Authentication Endpoints

### `POST /api/v1/auth/register`
Creates a new developer account.
- **Request Body:**
  ```json
  {
    "email": "developer@company.com",
    "password": "SecurePassword123!",
    "full_name": "Jane Doe"
  }
  ```
- **Response `201 Created`:**
  ```json
  {
    "id": 1,
    "email": "developer@company.com",
    "full_name": "Jane Doe",
    "is_active": true,
    "is_superuser": false,
    "created_at": "2026-10-15T12:00:00Z",
    "updated_at": "2026-10-15T12:00:00Z"
  }
  ```

### `POST /api/v1/auth/login`
Authenticates credentials, returns JWT tokens in JSON body, and sets `access_token` and `refresh_token` HttpOnly cookies.
- **Request Body:**
  ```json
  {
    "email": "developer@company.com",
    "password": "SecurePassword123!"
  }
  ```
- **Response `200 OK`:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "expires_in": 3600
  }
  ```

### `POST /api/v1/auth/refresh`
Rotates the refresh token and issues a fresh access token. Accepts token from body or cookie.

### `POST /api/v1/auth/logout`
Clears authentication cookies.

### `GET /api/v1/auth/me`
Returns current authenticated user profile. Requires Authorization header or cookie.

---

## 2. Website Monitoring Endpoints

### `GET /api/v1/websites`
Returns all monitored websites for the authenticated user.

### `POST /api/v1/websites`
Registers a new website and automatically enqueues initial baseline capture in background.
- **Request Body:**
  ```json
  {
    "name": "Acme Pricing Page",
    "url": "https://acme.inc/pricing",
    "check_interval_minutes": 30,
    "ignored_selectors": [".live-chat", "#cookie-consent", "footer .timestamp"]
  }
  ```
- **Response `201 Created`:** Returns created Website entity.

### `GET /api/v1/websites/{id}`
Returns website details, including configured ignored regions, recent 20 snapshots, and recent 20 changes.

### `PUT /api/v1/websites/{id}`
Updates monitor name, interval, or active toggle.

### `DELETE /api/v1/websites/{id}`
Cascades deletion of monitor and its associated snapshots and diff records.

### `POST /api/v1/websites/{id}/check`
Triggers an immediate on-demand monitoring check.
- **Query Params:** `sync=true|false` (default: `false`).
- If `sync=true`, waits for Playwright browser render and returns full diff outcome.

---

## 3. Snapshots Endpoints

### `GET /api/v1/snapshots/website/{website_id}`
Returns historical snapshots for a specific website.

### `GET /api/v1/snapshots/{id}`
Returns snapshot metadata along with full sanitized HTML and normalized text strings loaded from storage.

---

## 4. Detected Changes & Diff Endpoints

### `GET /api/v1/changes/recent`
Returns recent change detections across all user websites.

### `GET /api/v1/changes/{id}`
Returns full change metrics and the complete structured side-by-side diff JSON payload for UI rendering:
```json
{
  "id": 14,
  "website_id": 2,
  "change_percentage": 14.5,
  "lines_added": 3,
  "lines_removed": 1,
  "summary": "Content changed by 14.5% (+3 lines added, -1 lines removed). Affected: '$49/month...'",
  "diff_details": {
    "has_changes": true,
    "change_percentage": 14.5,
    "lines_added": 3,
    "lines_removed": 1,
    "lines_modified": 2,
    "unified_diff": "--- previous_version\n+++ current_version\n...",
    "chunks": [ ... ]
  }
}
```

---

## 5. Ignored Regions Endpoints

### `POST /api/v1/ignored-regions/website/{website_id}`
Adds a noise filtering selector rule to a website.
- **Request Body:**
  ```json
  {
    "selector_type": "css",
    "selector_value": ".dynamic-stock-counter",
    "description": "Excludes live stock updates"
  }
  ```

### `DELETE /api/v1/ignored-regions/{id}`
Removes an ignored region rule.

---

## 6. Notifications Endpoints

### `GET /api/v1/notifications/channels`
Lists configured notification channels.

### `POST /api/v1/notifications/channels`
Registers a new alert channel. Supported `channel_type`: `email`, `discord`, `telegram`.
- **Discord Example:**
  ```json
  {
    "channel_type": "discord",
    "name": "DevOps Alerts",
    "config": {
      "webhook_url": "https://discord.com/api/webhooks/..."
    }
  }
  ```

### `POST /api/v1/notifications/channels/{id}/test`
Dispatches a diagnostic test alert to verify webhook credentials.

### `GET /api/v1/notifications/logs`
Returns the recent 50 alert dispatch audit logs.

---

## 7. Dashboard Endpoints

### `GET /api/v1/dashboard/summary`
Returns high-level status counts, 24h checks, average render latency, 24h latency timeseries graph points, and activity stream.

---

## 8. Interview Explanation Guide

**Q: How do you design authentication to support both Single Page Applications and programmatic CLI tools?**
> *"Our authentication layer uses dual-token resolution. The `/auth/login` endpoint returns the access and refresh tokens in both JSON body (for programmatic clients or mobile apps) and as secure HttpOnly, SameSite=Lax cookies (for browser SPAs). The `get_token_from_request` dependency inspects the standard `Authorization: Bearer <token>` header first, and gracefully falls back to the cookie if the header is absent. This ensures zero CSRF vulnerability in browsers while remaining developer-friendly for curl or CLI scripting."*
