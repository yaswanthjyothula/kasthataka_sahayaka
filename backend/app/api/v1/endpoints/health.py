from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health")
async def check_health():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": "development"
    }
