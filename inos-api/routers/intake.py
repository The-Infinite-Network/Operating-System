from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.gemini_service import extract_twin_profile
import json

router = APIRouter()

class SocraticSubmission(BaseModel):
    user_id: str
    raw_dialogue: str

@router.post("/extract-twin")
async def process_twin_intake(submission: SocraticSubmission):
    try:
        # Run the Gemini extraction using the canonical prompt
        extracted_data = extract_twin_profile(submission.raw_dialogue)
        
        # Here we will eventually save this to Notion/Firebase
        # For now, return the structured payload to the React frontend
        return {
            "status": "success", 
            "twin_id": f"TWIN-{submission.user_id[:6].upper()}",
            "profile": json.loads(extracted_data)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
