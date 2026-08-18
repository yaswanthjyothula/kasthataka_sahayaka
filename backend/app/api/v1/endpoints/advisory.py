from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def advisory_status():
    return {"module": "advisory", "status": "scaffolded"}
