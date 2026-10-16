import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application Settings configured via environment variables or .env file.
    Follows 12-factor application configuration principles.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # General
    PROJECT_NAME: str = "Website Change Detector"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    APP_SECRET_KEY: str = "change-this-in-production-super-secret-key-32charsmin"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    # Database
    # Supports PostgreSQL (asyncpg) or local SQLite (aiosqlite)
    DATABASE_URL: str = "sqlite+aiosqlite:///./change_detector.db"
    # For sync operations like Alembic or Celery if needed:
    DATABASE_SYNC_URL: str = "sqlite:///./change_detector.db"

    # JWT Authentication
    JWT_SECRET_KEY: str = "jwt-secret-key-super-secure-change-in-production-min32"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Storage (Local or S3)
    STORAGE_DRIVER: str = "local"  # "local" or "s3"
    LOCAL_STORAGE_DIR: str = "./storage_data"
    S3_BUCKET_NAME: str = "website-change-detector-snapshots"
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""

    # Celery & Redis
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # Playwright Browser Automation
    PLAYWRIGHT_HEADLESS: bool = True
    PLAYWRIGHT_TIMEOUT_MS: int = 30000
    PLAYWRIGHT_USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 WebsiteChangeDetector/1.0"
    )

    # Email Notifications (SMTP)
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "alerts@changedetector.local"
    SMTP_USE_TLS: bool = True

    # Telegram Bot
    TELEGRAM_DEFAULT_BOT_TOKEN: str = ""

    # Scheduler Interval Defaults
    DEFAULT_CHECK_INTERVAL_MINUTES: int = 60


settings = Settings()
