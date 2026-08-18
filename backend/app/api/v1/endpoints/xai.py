from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def xai_status():
    return {"module": "xai", "status": "scaffolded"}
