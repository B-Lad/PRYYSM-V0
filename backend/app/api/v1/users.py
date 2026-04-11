from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from pydantic import BaseModel

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: str

@router.post("/", status_code=201)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # TODO: Add SQLAlchemy model insertion & password hashing
    return {"message": f"User {user.username} created", "email": user.email}