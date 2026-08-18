from fastapi import APIRouter
from app.api.v1.endpoints import health, auth, ingestion, detection, xai, advisory, weather

api_router = APIRouter()

api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Auth"])
api_router.include_router(ingestion.router, prefix="/ingestion", tags=["Ingestion"])
api_router.include_router(detection.router, prefix="/detection", tags=["Detection"])
api_router.include_router(xai.router, prefix="/xai", tags=["XAI"])
api_router.include_router(advisory.router, prefix="/advisory", tags=["Advisory"])
api_router.include_router(weather.router, prefix="/weather", tags=["Weather"])
