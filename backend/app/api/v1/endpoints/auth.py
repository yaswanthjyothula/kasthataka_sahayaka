from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    # Stub login for persona testing
    roles_map = {
        "farmer": "farmer",
        "officer": "officer",
        "admin": "agronomist_admin"
    }
    role = roles_map.get(credentials.username.lower(), "farmer")
    
    return TokenResponse(
        access_token=f"stub-token-for-{credentials.username}",
        token_type="bearer",
        role=role
    )
