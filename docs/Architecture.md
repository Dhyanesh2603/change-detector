# System Architecture & Design Specification

## Overview

The **Website Change Detection Platform** is engineered as a high-reliability **Modular Monolith**. It avoids the distributed transaction and network hop overhead of microservices while enforcing strict domain separation and clean interface boundaries.

Every module within the monolith possesses a single, well-defined responsibility. The system is designed to continuously monitor public websites, render complex client-side dynamic web applications using headless browser automation, filter out non-semantic noise (timestamps, ads, CSRF tokens), compute deterministic content hashes, calculate fine-grained diffs, and dispatch notifications across multiple channels.

---

## 1. Overall System Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Frontend)"]
        ReactApp["React 19 + TypeScript SPA"]
        TanStackQuery["TanStack Query (State & Caching)"]
        DiffUI["Developer Diff Viewer & Dashboard"]
        ReactApp --> TanStackQuery
        ReactApp --> DiffUI
    end

    subgraph APILayer ["API Gateway & Core (FastAPI)"]
        FastAPI["FastAPI Modular Monolith"]
        AuthMiddleware["JWT & HttpOnly Cookie Guard"]
        APIRouters["REST API Routers (v1)"]
        FastAPI --> AuthMiddleware
        AuthMiddleware --> APIRouters
    end

    subgraph ServiceLayer ["Domain Services Layer"]
        WebsiteService["WebsiteService"]
        MonitorService["MonitorService (Pipeline Coordinator)"]
        SnapshotService["SnapshotService"]
        ChangeService["ChangeService"]
        APIRouters --> WebsiteService
        APIRouters --> MonitorService
        APIRouters --> SnapshotService
        APIRouters --> ChangeService
    end

    subgraph DataLayer ["Data & Storage Layer"]
        PostgresDB[("PostgreSQL / SQLite (3NF Schema)")]
        StorageDriver["StorageDriver Abstraction (Local / S3)"]
        SnapshotFiles[("Snapshot Files (HTML, Text, PNG, Diff JSON)")]
        WebsiteService --> PostgresDB
        MonitorService --> PostgresDB
        StorageDriver --> SnapshotFiles
    end

    subgraph BackgroundExecution ["Async Execution & Workers"]
        Scheduler["AsyncSchedulerService / Celery Beat"]
        JobQueue[("Redis Queue / Celery")]
        PlaywrightWorkers["Playwright Headless Chromium Workers"]
        Scheduler --> JobQueue
        JobQueue --> PlaywrightWorkers
        PlaywrightWorkers --> MonitorService
    end

    subgraph DiffAndNoiseSubsystem ["Diff & Normalization Subsystem"]
        HTMLNormalizer["HTMLNormalizer (BS4 Noise Stripper)"]
        HashEngine["HashEngine (SHA-256 Digest)"]
        DiffEngineCore["DiffEngine (difflib SequenceMatcher)"]
        MonitorService --> HTMLNormalizer
        HTMLNormalizer --> HashEngine
        HashEngine --> DiffEngineCore
        DiffEngineCore --> StorageDriver
    end

    subgraph NotificationSubsystem ["Notification Dispatcher"]
        NotificationDispatcher["NotificationDispatcher"]
        EmailNotifier["SMTP Email Worker"]
        DiscordNotifier["Discord Webhook Client"]
        TelegramNotifier["Telegram Bot Client"]
        MonitorService --> NotificationDispatcher
        NotificationDispatcher --> EmailNotifier
        NotificationDispatcher --> DiscordNotifier
        NotificationDispatcher --> TelegramNotifier
    end

    ClientLayer <-->|HTTP / JSON REST & Cookies| APILayer
```

---

## 2. Sequence Diagram: Website Monitoring Request (On-Demand Check)

```mermaid
sequenceDiagram
    autonumber
    actor Developer as Developer (Dashboard)
    participant API as FastAPI Router (/websites/{id}/check)
    participant Monitor as MonitorService
    participant Browser as Playwright BrowserRunner
    participant Normalizer as HTMLNormalizer
    participant Storage as StorageDriver
    participant Diff as DiffEngine
    participant DB as PostgreSQL Database
    participant Notif as NotificationDispatcher

    Developer->>API: POST /api/v1/websites/42/check
    API->>DB: Update website status = 'CHECKING'
    API->>Monitor: execute_check(website_id=42)
    Monitor->>Browser: capture_page(target_url)
    activate Browser
    Browser-->>Monitor: Return (raw_html, screenshot_bytes, latency_ms, http_status)
    deactivate Browser

    Monitor->>Normalizer: clean_html_and_extract_text(raw_html, ignored_regions)
    activate Normalizer
    Normalizer-->>Monitor: Return (sanitized_html, normalized_text, page_title)
    deactivate Normalizer

    Monitor->>Monitor: HashEngine.compute_sha256(normalized_text)
    Monitor->>DB: Query latest baseline Snapshot for website 42

    alt Hashes match (No meaningful change)
        Monitor->>DB: Update website status = 'HEALTHY', last_checked_at
        Monitor-->>API: Status: 'unchanged'
    else Content modified (Hashes differ)
        Monitor->>Storage: Read previous snapshot normalized_text
        Storage-->>Monitor: previous_text
        Monitor->>Diff: compare(previous_text, normalized_text)
        Diff-->>Monitor: Return diff_metrics (added, removed, %, summary, chunks)

        Monitor->>Storage: save_file(page.html, normalized.txt, screenshot.png)
        Monitor->>Storage: save_file(diff_result.json)
        Monitor->>DB: Insert Snapshot record
        Monitor->>DB: Insert DetectedChange record
        Monitor->>DB: Update website status = 'CHANGED', last_changed_at

        Monitor->>Notif: dispatch_change_alert(website, change, summary)
        Notif->>DB: Log Notification audit record
        Monitor-->>API: Status: 'changed', change_id, diff_summary
    end

    API-->>Developer: Return 200 OK + Execution Result JSON
```

---

## 3. Sequence Diagram: Background Scheduled Check

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as AsyncScheduler / Celery Beat
    participant DB as PostgreSQL Database
    participant Queue as Redis Celery Queue
    participant Worker as Background Worker (tasks.py)
    participant Monitor as MonitorService

    loop Every 60 Seconds
        Scheduler->>DB: Query active websites where now >= last_checked_at + interval
        DB-->>Scheduler: Return due website IDs: [12, 45, 89]
        loop For each due ID
            Scheduler->>Queue: Enqueue check_website_task(id)
        end
    end

    Queue->>Worker: Consume check_website_task(id=12)
    Worker->>Monitor: execute_check(website_id=12)
    Monitor->>DB: Execute check pipeline, persist snapshots, dispatch alerts
    Worker-->>Queue: Acknowledge task completion
```

---

## 4. Key Design Decisions

### Modular Monolith over Microservices
1. **Zero RPC Latency:** Communication between `MonitorService`, `DiffEngine`, and `StorageDriver` happens within Python in-memory method calls rather than gRPC/HTTP overhead.
2. **Simplified Atomic Transactions:** Relational integrity across `Website`, `Snapshot`, and `DetectedChange` tables can be managed within standard database transaction blocks (`session.commit()` / `session.rollback()`).
3. **Low Operational Overhead:** The single codebase can run locally as a zero-dependency process using SQLite and in-process background scheduling, while scaling seamlessly in production with PostgreSQL, Celery, and Redis.

### Playwright Headless Automation
- **Real Single-Page Application (SPA) Rendering:** Traditional cURL/HTTP requests fail on modern React/Vue websites because the raw HTML is an empty `<div id="root"></div>`. Playwright executes JavaScript, waits for `networkidle` or `domcontentloaded`, and captures the true rendered DOM.
- **Visual Proof:** Playwright captures full-page high-resolution PNG screenshots alongside DOM serialization, enabling developers to visually inspect changes side-by-side.

### Deterministic Noise Filtering
- Before content hashing, `HTMLNormalizer` strips volatile non-semantic elements: `<script>`, `<style>`, `<iframe>`, cookie banners, Google Ads containers, ISO timestamps, live view counters, and user-specified CSS selectors.
- This ensures that SHA-256 hashes remain stable and only trigger alerts when human-meaningful content changes.

---

## 5. Interview Explanation Guide

**Q: Why choose a Modular Monolith instead of Microservices?**
> *"For a website change detection system, the primary bottleneck is I/O (browser rendering and network latency), not CPU saturation from inter-service communication. By adopting a Modular Monolith with bounded contexts, we eliminate network failures between services, avoid distributed 2-phase commits, maintain high development velocity, and simplify deployment down to a single container. If scale warrants, each module (e.g. Playwright Worker) can be decoupled into an independent worker service via our existing Celery task queue."*

**Q: How do you prevent false positives from dynamic websites?**
> *"We employ a 3-tier noise reduction pipeline: First, DOM tree sanitization strips all script, style, ad, and cookie banner tags. Second, regex normalization masks dynamic tokens such as timestamps (`[TIMESTAMP]`), session IDs (`[HASH_TOKEN]`), and view counts (`[DYNAMIC_COUNTER]`). Third, users can configure custom CSS selectors to target or exclude specific DOM regions. Only the sanitized textual content is SHA-256 hashed."*
