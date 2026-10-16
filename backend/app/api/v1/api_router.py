from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    websites,
    snapshots,
    changes,
    ignored_regions,
    notifications,
    dashboard,
    system,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(websites.router)
api_router.include_router(snapshots.router)
api_router.include_router(changes.router)
api_router.include_router(ignored_regions.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
api_router.include_router(system.router)
