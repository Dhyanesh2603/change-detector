import mimetypes
from fastapi import APIRouter, HTTPException, status, Response
from app.storage import get_storage_driver
from app.core.config import settings

router = APIRouter(tags=["System"])


@router.get("/health")
async def health_check():
    """
    Diagnostic health probe verifying service uptime and configuration.
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "storage_driver": settings.STORAGE_DRIVER
    }


@router.get("/storage/{file_path:path}")
async def serve_storage_file(file_path: str):
    """
    Serves stored assets (screenshots, raw html, diff data) via storage driver.
    """
    storage = get_storage_driver()
    try:
        content_bytes = await storage.read_file(file_path)
    except FileNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid path")

    media_type, _ = mimetypes.guess_type(file_path)
    if not media_type:
        if file_path.endswith(".png"):
            media_type = "image/png"
        elif file_path.endswith(".html"):
            media_type = "text/html; charset=utf-8"
        elif file_path.endswith(".json"):
            media_type = "application/json"
        else:
            media_type = "text/plain; charset=utf-8"

    return Response(content=content_bytes, media_type=media_type)
