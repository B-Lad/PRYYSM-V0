from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_service import generate_ai_response

router = APIRouter()

class AIRequest(BaseModel):
    prompt: str

@router.post("/generate")
async def generate(req: AIRequest):
    try:
        response = await generate_ai_response(req.prompt)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))