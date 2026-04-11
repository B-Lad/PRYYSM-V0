from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token
from app.core.dependencies import get_current_tenant

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str
    tenant_id: str

@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Authenticate user and return JWT with tenant context.
    In production: validate against database with hashed passwords.
    """
    # TODO: Validate credentials against database
    # TODO: Verify password with passlib
    # TODO: Fetch user role from database
    
    # Mock successful login for development
    if req.password != "password":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create JWT with tenant context embedded
    access_token = create_access_token(
        data={
            "sub": "user-001",
            "tenant_id": req.tenant_id,
            "role": "admin",
            "email": req.email
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": "user-001",
            "email": req.email,
            "tenant_id": req.tenant_id,
            "role": "admin"
        }
    }

@router.get("/me")
async def get_current_user(tenant=Depends(get_current_tenant)):
    """Get current user info with tenant context"""
    return {
        "id": tenant.user_id,
        "email": tenant.email,
        "tenant_id": tenant.tenant_id,
        "role": tenant.role
    }

@router.post("/logout")
async def logout():
    """Client should remove token from storage"""
    return {"message": "Logged out successfully"}
