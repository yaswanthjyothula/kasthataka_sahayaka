from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def detection_status():
    return {"module": "detection", "status": "scaffolded"}
