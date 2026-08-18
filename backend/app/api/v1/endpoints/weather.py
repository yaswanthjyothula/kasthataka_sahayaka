from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def weather_status():
    return {"module": "weather", "status": "scaffolded"}
