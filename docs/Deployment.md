# Production Deployment Architecture

## Overview

The platform supports two primary deployment topologies:
1. **Containerized Monolith (Docker Compose / Railway / VPS):** Single multi-container deployment running FastAPI, PostgreSQL, Redis, Celery Workers, and Celery Beat.
2. **Modern Serverless / Managed Cloud:**
   - **Frontend:** Vercel (Edge CDN)
   - **Backend API:** Railway / Render / VPS
   - **Database:** Managed PostgreSQL (Neon / Supabase / Railway)
   - **Redis:** Upstash Serverless Redis
   - **Storage:** AWS S3 / Cloudflare R2

---

## 1. Deployment Topology Diagram

```mermaid
flowchart TD
    subgraph ClientBrowser ["Client Browser"]
        UserDevice["Web Browser / Developer Laptop"]
    end

    subgraph VercelEdge ["Vercel Edge Network (Frontend)"]
        VercelCDN["Vercel Global CDN (Vite React 19 SPA)"]
        EdgeRouting["Vite Static Asset Distribution"]
        VercelCDN --> EdgeRouting
    end

    subgraph BackendInfrastructure ["Backend Infrastructure (Railway / Render / VPS)"]
        ReverseProxy["Caddy / Nginx Reverse Proxy (SSL / TLS)"]
        FastAPIApp["FastAPI Modular Monolith API (:8000)"]
        CeleryWorkerPool["Celery Worker Pool (Playwright Workers)"]
        CeleryBeatDaemon["Celery Beat Scheduler Daemon"]

        ReverseProxy --> FastAPIApp
        FastAPIApp --> CeleryWorkerPool
        CeleryBeatDaemon --> CeleryWorkerPool
    end

    subgraph CloudServices ["Managed Cloud Services"]
        PostgresCloud[("Managed PostgreSQL (Neon / Railway / AWS RDS)")]
        UpstashRedis[("Upstash Redis (Serverless Message Broker)")]
        S3Storage[("AWS S3 / Cloudflare R2 (Snapshots, Screenshots)")]
    end

    UserDevice <-->|HTTPS| VercelCDN
    UserDevice <-->|HTTPS / REST API & Cookies| ReverseProxy
    FastAPIApp <--> PostgresCloud
    CeleryWorkerPool <--> PostgresCloud
    FastAPIApp <--> UpstashRedis
    CeleryWorkerPool <--> UpstashRedis
    CeleryBeatDaemon <--> UpstashRedis
    FastAPIApp <--> S3Storage
    CeleryWorkerPool <--> S3Storage
```

---

## 2. Docker Compose Production Deployment

The root `docker-compose.yml` provides a production-grade orchestration:

```bash
# Build and launch all services in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f api celery_worker

# Run database migrations
docker compose exec api alembic upgrade head
```

### Services Orchestrated:
- **`postgres`:** PostgreSQL 16 Alpine with persistent volume.
- **`redis`:** Redis 7 Alpine with persistent volume.
- **`api`:** FastAPI ASGI application with Playwright dependencies.
- **`celery_worker`:** Concurrency 4 Playwright worker pool.
- **`celery_beat`:** Periodic 60-second scheduler daemon.

---

## 3. Environment Configuration Checklist

| Variable | Description | Production Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Runtime environment | `production` |
| `DEBUG` | Verbose debug mode | `false` |
| `DATABASE_URL` | Async PostgreSQL connection string | `postgresql+asyncpg://user:pass@ep-xyz.neon.tech/db` |
| `DATABASE_SYNC_URL` | Sync connection string for Alembic | `postgresql://user:pass@ep-xyz.neon.tech/db` |
| `JWT_SECRET_KEY` | 256-bit cryptographic key for tokens | `64_char_hex_secret...` |
| `CELERY_BROKER_URL` | Redis broker URL | `rediss://default:token@xyz.upstash.io:6379` |
| `STORAGE_DRIVER` | File storage provider | `s3` |
| `S3_BUCKET_NAME` | S3 bucket for snapshots | `production-change-detector-snapshots` |
| `PLAYWRIGHT_HEADLESS` | Run Chromium headless | `true` |

---

## 4. Interview Explanation Guide

**Q: How do you handle Playwright system dependencies inside a Linux Docker container?**
> *"Chromium requires underlying Linux graphic libraries (such as `libnss3`, `libx11`, `libpango`, and `libgbm1`) to run headless. Our Dockerfile installs these system shared libraries via `apt-get` and executes `playwright install --with-deps chromium`. In addition, we pass runtime launch arguments (`--no-sandbox`, `--disable-dev-shm-usage`, and `--disable-gpu`) so Chromium runs stably inside restricted containerized cgroups."*
