from fastapi import Request
from typing import Optional
from app.core.security import decode_access_token


async def get_tenant_from_token(request: Request) -> Optional[str]:
    """Extract tenant_id from Authorization header"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]
    try:
        payload = decode_access_token(token)
    except ValueError:
        return None

    return payload.get("tenant_id")


async def set_tenant_context(request: Request, call_next):
    """Middleware to set tenant context for RLS"""
    tenant_id = await get_tenant_from_token(request)

    if tenant_id:
        # Set tenant context for this request (used by RLS policies)
        request.state.tenant_id = tenant_id

    response = await call_next(request)
    return response
