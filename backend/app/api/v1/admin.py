from fastapi import APIRouter, Depends
from app.core.dependencies import CurrentUser

router = APIRouter()

@router.get("/machines")
async def get_machines(user: CurrentUser):
    """Get machines for current tenant"""
    return []

@router.get("/users")
async def get_users(user: CurrentUser):
    """Get users for current tenant only"""
    return []

@router.get("/settings")
async def get_settings(user: CurrentUser):
    """Get tenant-specific settings"""
    return {
        "tenant_id": user.tenant_id,
        "features": ["am_review", "lifecycle", "qc"],
        "members_only": True
    }
