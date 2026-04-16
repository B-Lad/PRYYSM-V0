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


@router.post("/tenants", response_model=TenantOut)
def create_tenant(data: TenantCreate, db: Session = Depends(get_db)):
    try:
        existing = db.query(Tenant).filter(Tenant.slug == data.slug).first()
        if existing:
            raise HTTPException(
                status_code=400, detail="A company with this slug already exists"
            )

        tenant = Tenant(
            id=str(uuid.uuid4()),
            name=data.name,
            slug=data.slug,
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)

        admin_user = User(
            id=str(uuid.uuid4()),
            email=data.admin_email,
            full_name="Admin",
            hashed_password=get_password_hash(data.admin_password),
            role="admin",
            tenant_id=tenant.id,
            is_active=True,
        )
        db.add(admin_user)
        db.commit()

        return tenant
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tenants", response_model=List[TenantOut])
def list_tenants(db: Session = Depends(get_db)):
    return db.query(Tenant).all()


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
