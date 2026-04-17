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
from schemas.schemas import (
    AccessOptionsOut,
    TenantCreate,
    TenantOut,
    TenantUpdate,
    UserOut,
)
from passlib.context import CryptContext
import uuid

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


def ensure_super_admin(ctx: CurrentTenant):
    if ctx.role != "super_admin":
        raise HTTPException(status_code=403, detail="Only super admin can do this")


def ensure_company_admin_or_super_admin(ctx: CurrentTenant):
    if ctx.role not in {"super_admin", "admin"}:
        raise HTTPException(status_code=403, detail="Admin access required")


def serialize_tenant(tenant: Tenant):
    settings = normalize_tenant_settings(tenant.settings or {})
    return {
        "id": tenant.id,
        "name": tenant.name,
        "slug": tenant.slug,
        "contact_email": settings.get("contact_email", ""),
        "max_users": settings.get("max_users", 5),
        "max_machines": settings.get("max_machines", 2),
        "created_at": tenant.created_at.isoformat() if tenant.created_at else None,
    }


def serialize_member(user: User, tenant: Tenant):
    settings = normalize_tenant_settings(tenant.settings)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "tenant_id": tenant.id,
        "allowed_tabs": get_user_tabs(settings, user.id, user.role),
    }


@router.post("/tenants", response_model=TenantOut)
def create_tenant(
    data: TenantCreate,
    ctx: CurrentTenant,
    db: Session = Depends(get_db),
):
    ensure_super_admin(ctx)

    try:
        existing = db.query(Tenant).filter(Tenant.slug == data.slug).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="A company with this slug already exists"
            )
        existing_admin = db.query(User).filter(User.email == data.admin_email).first()
        if existing_admin:
            raise HTTPException(
                status_code=400, detail="This admin email is already in use"
            )

        tenant_id = str(uuid.uuid4())
        tenant = Tenant(
            id=tenant_id,
            name=data.name,
            slug=data.slug,
            settings=normalize_tenant_settings(
                {
                    "max_users": data.max_users,
                    "max_machines": data.max_machines,
                    "contact_email": data.contact_email or "",
                    "member_access": {},
                }
            ),
        )
        db.add(tenant)
        db.flush()

        admin_user = User(
            id=str(uuid.uuid4()),
            email=data.admin_email,
            full_name=f"{data.name} Admin",
            hashed_password=get_password_hash(data.admin_password),
            role="admin",
            tenant_id=tenant_id,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(tenant)
        return serialize_tenant(tenant)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenants")
def list_tenants(ctx: CurrentTenant, db: Session = Depends(get_db)):
    ensure_super_admin(ctx)
    try:
        tenants = db.query(Tenant).order_by(Tenant.created_at.desc()).all()
        return [serialize_tenant(tenant) for tenant in tenants]
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}


@router.get("/tenant/{tenant_id}", response_model=TenantOut)
def get_tenant(tenant_id: str, ctx: CurrentTenant, db: Session = Depends(get_db)):
    ensure_super_admin(ctx)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return serialize_tenant(tenant)


@router.put("/tenant/{tenant_id}", response_model=TenantOut)
def update_tenant(
    tenant_id: str,
    data: TenantUpdate,
    ctx: CurrentTenant,
    db: Session = Depends(get_db),
):
    ensure_super_admin(ctx)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    if data.slug and data.slug != tenant.slug:
        existing = db.query(Tenant).filter(Tenant.slug == data.slug).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="A company with this slug already exists"
            )
        tenant.slug = data.slug

    if data.name:
        tenant.name = data.name

    settings = normalize_tenant_settings(tenant.settings)
    if data.contact_email is not None:
        settings["contact_email"] = data.contact_email
    if data.max_users is not None:
        active_users = (
            db.query(User)
            .filter(User.tenant_id == tenant.id, User.is_active.is_(True))
            .count()
        )
        if data.max_users < active_users:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot set max users below current active users ({active_users})",
            )
        settings["max_users"] = data.max_users
    if data.max_machines is not None:
        settings["max_machines"] = data.max_machines

    tenant.settings = settings
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return serialize_tenant(tenant)


@router.get("/tenant/{tenant_id}/users", response_model=list[UserOut])
def get_tenant_users(tenant_id: str, ctx: CurrentTenant, db: Session = Depends(get_db)):
    ensure_super_admin(ctx)
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    users = db.query(User).filter(User.tenant_id == tenant_id).all()
    return [serialize_member(user, tenant) for user in users]


@router.get("/company/profile", response_model=TenantOut)
def get_company_profile(ctx: CurrentTenant, db: Session = Depends(get_db)):
    ensure_company_admin_or_super_admin(ctx)
    tenant = db.query(Tenant).filter(Tenant.id == ctx.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Company not found")
    return serialize_tenant(tenant)


@router.get("/company/members", response_model=list[UserOut])
def get_company_members(ctx: CurrentTenant, db: Session = Depends(get_db)):
    ensure_company_admin_or_super_admin(ctx)
    tenant = db.query(Tenant).filter(Tenant.id == ctx.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Company not found")
    users = db.query(User).filter(User.tenant_id == tenant.id).all()
    return [serialize_member(user, tenant) for user in users]


@router.get("/access-options", response_model=AccessOptionsOut)
def get_access_options(ctx: CurrentTenant):
    ensure_company_admin_or_super_admin(ctx)
    return {
        "all_tabs": list(ALL_SECTION_IDS),
        "assignable_tabs": list(MEMBER_ASSIGNABLE_SECTION_IDS),
    }
