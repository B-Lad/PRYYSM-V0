from fastapi import Depends, HTTPException, status, Request
from pydantic import BaseModel
from app.core.security import decode_access_token
from typing import Annotated
from sqlalchemy.orm import Session
from app.core.database import get_db
from db.models import User


class TenantContext(BaseModel):
    user_id: str
    email: str
    tenant_id: str
    role: str
    full_name: str = ""
    is_active: bool = True


async def get_current_tenant(
    request: Request, db: Session = Depends(get_db)
) -> TenantContext:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    token = auth_header.split(" ")[1]

    try:
        payload = decode_access_token(token)
        user_id: str = payload.get("sub")
        if not user_id:
            raise ValueError("Missing claims in token")

        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")

        tenant_id = str(user.tenant_id or payload.get("tenant_id") or "")
        role = user.role

        if not role:
            raise ValueError("Missing claims in token")

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
        )

    return TenantContext(
        user_id=user_id,
        email=user.email,
        tenant_id=tenant_id,
        role=role,
        full_name=user.full_name or "",
        is_active=user.is_active,
    )


CurrentTenant = Annotated[TenantContext, Depends(get_current_tenant)]
CurrentUser = CurrentTenant  # Alias for user context
