from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict

router = APIRouter()

class UserProfile(BaseModel):
    email: str
    selectedLayout: str
    onboardingComplete: bool = True
    custom_grid: Optional[Dict[str, Optional[str]]] = None

class ProfileRequest(BaseModel):
    email: str

user_profiles = {}

@router.post("/save")
async def save_profile(profile: UserProfile):
    user_profiles[profile.email] = profile
    print(f"[API] Profile Saved for {profile.email}: {profile.selectedLayout}")
    return {"status": "success", "message": "Saved"}

@router.post("/fetch")
async def get_profile(req: ProfileRequest):
    if req.email in user_profiles:
        # Convert Pydantic object to dict for return
        return user_profiles[req.email].model_dump()
    return {"status": "not_found", "selectedLayout": "unified", "custom_grid": None}
