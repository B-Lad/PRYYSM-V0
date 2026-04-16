from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.config import settings
from db.models import User, Tenant
from schemas.schemas import TenantCreate, TenantOut
from passlib.context import CryptContext
import uuid

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password):
    return pwd_context.hash(password)


def get_current_user_id(token: str = None):
    if not token:
        return None
    payload = decode_access_token(token)
    return payload


@router.post("/tenants")
def create_tenant(data: TenantCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(Tenant).filter(Tenant.slug == data.slug).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="A company with this slug already exists"
            )

        tenant_id = str(uuid.uuid4())
        tenant = Tenant(
            id=tenant_id,
            name=data.name,
            slug=data.slug,
            settings={"max_users": data.max_users, "max_machines": data.max_machines},
        )
        db.add(tenant)
        db.commit()

        admin_user = User(
            id=str(uuid.uuid4()),
            email=data.admin_email,
            full_name="Admin",
            hashed_password=get_password_hash(data.admin_password),
            role="admin",
            tenant_id=tenant_id,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()

        return {
            "id": tenant_id,
            "name": data.name,
            "slug": data.slug,
            "max_users": data.max_users,
            "max_machines": data.max_machines,
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenants")
def list_tenants(db: Session = Depends(get_db)):
    tenants = db.query(Tenant).all()
    return [
        {
            "id": t.id,
            "name": t.name,
            "slug": t.slug,
            "max_users": (t.settings or {}).get("max_users", 5),
            "max_machines": (t.settings or {}).get("max_machines", 2),
        }
        for t in tenants
    ]


@router.get("/tenant/{tenant_id}")
def get_tenant(tenant_id: str, db: Session = Depends(get_db)):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return {
        "id": tenant.id,
        "name": tenant.name,
        "slug": tenant.slug,
        "max_users": (tenant.settings or {}).get("max_users", 5),
        "max_machines": (tenant.settings or {}).get("max_machines", 2),
    }


@router.get("/tenant/{tenant_id}/users", response_model=List)
def get_tenant_users(tenant_id: str, db: Session = Depends(get_db)):
    return db.query(User).filter(User.tenant_id == tenant_id).all()


@router.get("/machines")
async def get_machines():
    return []


@router.get("/users")
async def get_users():
    return []


@router.get("/settings")
async def get_settings():
    return {
        "tenant_id": "00000000-0000-0000-0000-000000000001",
        "features": ["am_review", "lifecycle", "qc"],
        "members_only": True,
    }
