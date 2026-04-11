from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.dependencies import TenantContext, get_current_tenant
# TODO: Import your User model here to fetch from DB

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str
    tenant_id: str  # User selects company on login

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_info: TenantContext

@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    # In production: Fetch user from DB by email & tenant_id
    # user = await db.execute(select(User).where(User.email == body.email, User.tenant_id == body.tenant_id)).scalar_one_or_none()
    # if not user or not verify_password(body.password, user.password_hash):
    #     raise HTTPException(status_code=401, detail="Incorrect credentials")
    
    # --- MOCK VALIDATION FOR DEMO ---
    # Accept any login with password "password" for testing
    if body.password != "password":
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    # Create Token with Claims
    token_data = {
        "sub": "user_123", 
        "email": body.email,
        "tenant_id": body.tenant_id,
        "role": "admin"
    }
    access_token = create_access_token(data=token_data)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_info": TenantContext(**token_data)
    }

@router.get("/me")
async def get_me(ctx: TenantContext = Depends(get_current_tenant)):
    return ctx