from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.access import (
    ALL_SECTION_IDS,
    MEMBER_ASSIGNABLE_SECTION_IDS,
    get_user_tabs,
    normalize_tenant_settings,
)
from app.core.database import get_db
from app.core.dependencies import CurrentTenant
from db.models import Tenant, User

router = APIRouter()


@router.get("/my-permissions")
def get_my_permissions(ctx: CurrentTenant, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == ctx.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    settings = normalize_tenant_settings(tenant.settings if tenant else {})
    allowed_tabs = get_user_tabs(settings, user.id, user.role)

    return {
        "role": user.role,
        "allowed_tabs": allowed_tabs,
        "all_tabs": list(ALL_SECTION_IDS),
        "assignable_tabs": list(MEMBER_ASSIGNABLE_SECTION_IDS),
    }


@router.get("/check/{section_id}")
def check_user_permission(section_id: str, ctx: CurrentTenant, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == ctx.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
    settings = normalize_tenant_settings(tenant.settings if tenant else {})
    allowed_tabs = get_user_tabs(settings, user.id, user.role)

    return {
        "section_id": section_id,
        "allowed": section_id in allowed_tabs,
        "allowed_tabs": allowed_tabs,
    }
