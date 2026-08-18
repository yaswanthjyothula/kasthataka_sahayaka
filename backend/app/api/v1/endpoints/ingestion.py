from fastapi import APIRouter, File, UploadFile, Form
from typing import Optional

router = APIRouter()


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    notes: Optional[str] = Form(None)
):
    return {
        "status": "received",
        "filename": file.filename,
        "content_type": file.content_type,
        "coordinates": {"lat": latitude, "lng": longitude} if latitude else None,
        "notes": notes
    }
