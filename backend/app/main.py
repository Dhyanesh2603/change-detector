import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.v1.api_router import api_router
from app.api.demo_site import router as demo_site_router
from app.scheduler.scheduler_service import AsyncSchedulerService
from app.core.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager: handles bootstrapping and cleanup.
    """
    logger.info("Initializing Website Change Detector database...")
    await init_db()

    logger.info("Starting background AsyncSchedulerService...")
    await AsyncSchedulerService.start(interval_seconds=60)

    yield

    logger.info("Shutting down AsyncSchedulerService...")
    await AsyncSchedulerService.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Developer-grade Website Change Detection & Diff Monitoring Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS for local development and production frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(demo_site_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": "1.0.0",
        "status": "operational",
        "docs": "/docs",
        "api_prefix": settings.API_V1_STR
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
