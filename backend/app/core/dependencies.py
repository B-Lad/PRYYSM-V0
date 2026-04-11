from fastapi import Depends, HTTPException, status, Request
from pydantic import BaseModel
from app.core.security import decode_access_token
from typing import Annotated


class TenantContext(BaseModel):
    user_id: str
    email: str
    tenant_id: str
    role: str


async def get_current_tenant(request: Request) -> TenantContext:
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
        tenant_id: str = payload.get("tenant_id")
        role: str = payload.get("role")

        if not user_id or not tenant_id or not role:
            raise ValueError("Missing claims in token")

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims",
        )

    return TenantContext(
        user_id=user_id, email=payload.get("email", ""), tenant_id=tenant_id, role=role
    )


CurrentTenant = Annotated[TenantContext, Depends(get_current_tenant)]
CurrentUser = CurrentTenant  # Alias for user context
