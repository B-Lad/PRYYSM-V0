from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.access import get_user_tabs, normalize_tenant_settings, set_user_tabs
from app.core.cache import cache_response
from app.core.database import get_db
from app.core.dependencies import CurrentTenant
from app.core.limiter import limiter
from app.core.security import create_access_token, decode_access_token
from db.models import Tenant, User
from schemas.schemas import (
    PasswordChange,
    PasswordSet,
    SessionOut,
    Token,
    UserCreate,
    UserLogin,
    UserOut,
    UserUpdate,
    UserUpdateMe,
)
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

router = APIRouter()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def get_tenant(db: Session, tenant_id: Optional[str]):
    if not tenant_id:
        return None
    return db.query(Tenant).filter(Tenant.id == tenant_id).first()


def serialize_user(user: User, tenant: Optional[Tenant] = None):
    resolved_tenant = tenant or get_tenant_object(user)
    settings = normalize_tenant_settings(
        resolved_tenant.settings if resolved_tenant else {}
    )
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "is_active": user.is_active,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        "allowed_tabs": get_user_tabs(settings, user.id, user.role),
    }


def serialize_session(user: User, tenant: Optional[Tenant] = None):
    resolved_tenant = tenant or get_tenant_object(user)
    settings = normalize_tenant_settings(
        resolved_tenant.settings if resolved_tenant else {}
    )
    is_super = user.role == "super_admin"
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "role": user.role,
        "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        "is_active": user.is_active,
        "allowed_tabs": get_user_tabs(settings, user.id, user.role),
        "tenant_name": resolved_tenant.name if resolved_tenant else None,
        "max_users": settings.get("max_users"),
        "max_machines": settings.get("max_machines"),
        "demo_mode": settings.get("demo_mode") if not is_super else True,
    }


def get_tenant_object(user: User):
    return getattr(user, "_tenant", None)


def attach_tenant(user: User, tenant: Optional[Tenant]):
    setattr(user, "_tenant", tenant)
    return user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(request: Request, req: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is inactive",
            )

        access_token = create_access_token(
            data={
                "sub": str(user.id),
                "role": user.role,
                "email": user.email,
                "tenant_id": str(user.tenant_id) if user.tenant_id else "",
            }
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "role": user.role,
            "tenant_id": str(user.tenant_id) if user.tenant_id else "",
            "user_id": str(user.id),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/register", response_model=UserOut)
@limiter.limit("3/minute")
def register(
    request: Request,
    user_data: UserCreate,
    ctx: CurrentTenant,
    db: Session = Depends(get_db),
):
    try:
        if ctx.role not in {"super_admin", "admin"}:
            raise HTTPException(status_code=403, detail="Not allowed to create users")

        db_user = db.query(User).filter(User.email == user_data.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        target_tenant_id = user_data.tenant_id or ctx.tenant_id
        if ctx.role == "admin":
            target_tenant_id = ctx.tenant_id
            if user_data.role in {"admin", "super_admin"}:
                raise HTTPException(
                    status_code=403,
                    detail="Company admin can only create sub members",
                )

        target_tenant = get_tenant(db, target_tenant_id)
        if not target_tenant:
            raise HTTPException(status_code=404, detail="Company not found")

        settings = normalize_tenant_settings(target_tenant.settings)
        active_users = (
            db.query(User)
            .filter(User.tenant_id == target_tenant.id, User.is_active.is_(True))
            .count()
        )
        if active_users >= settings["max_users"]:
            raise HTTPException(
                status_code=400,
                detail=f"User limit reached ({settings['max_users']} active users). Contact support to upgrade your plan.",
            )

        new_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role,
            tenant_id=target_tenant.id,
            is_active=True,
        )
        db.add(new_user)
        db.flush()

        target_tenant.settings = set_user_tabs(
            settings, new_user.id, new_user.role, user_data.allowed_tabs
        )
        db.add(target_tenant)
        db.commit()
        db.refresh(new_user)
        attach_tenant(new_user, target_tenant)
        return serialize_user(new_user, target_tenant)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=SessionOut)
def get_current_user(ctx: CurrentTenant, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == ctx.user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    tenant = get_tenant(db, user.tenant_id)
    attach_tenant(user, tenant)
    return serialize_session(user, tenant)


@router.put("/me", response_model=SessionOut)
def update_current_user(
    user_data: UserUpdateMe, ctx: CurrentTenant, db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == ctx.user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if email is being changed and already exists
    if user_data.email != user.email:
        existing = db.query(User).filter(User.email == user_data.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
            
    user.email = user_data.email
    user.full_name = user_data.full_name
    if user_data.avatar_url is not None:
        user.avatar_url = user_data.avatar_url
        
    db.commit()
    db.refresh(user)
    tenant = get_tenant(db, user.tenant_id)
    attach_tenant(user, tenant)
    return serialize_session(user, tenant)


@router.get("/users", response_model=List[UserOut])
def get_users(ctx: CurrentTenant, db: Session = Depends(get_db)):
    if ctx.role != "super_admin":
        raise HTTPException(
            status_code=403, detail="Only super admin can view all users"
        )

    users = db.query(User).all()
    tenants = {tenant.id: tenant for tenant in db.query(Tenant).all()}
    return [serialize_user(user, tenants.get(user.tenant_id)) for user in users]


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    user_data: UserUpdate,
    ctx: CurrentTenant,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if ctx.role == "admin":
        if str(user.tenant_id) != ctx.tenant_id:
            raise HTTPException(
                status_code=403, detail="Cannot edit users from another company"
            )
        if user.role in {"admin", "super_admin"}:
            raise HTTPException(status_code=403, detail="Cannot edit admin users")
        if user_data.role in {"admin", "super_admin"}:
            raise HTTPException(status_code=403, detail="Cannot promote user to admin")
    elif ctx.role != "super_admin":
        raise HTTPException(status_code=403, detail="Not allowed to update users")

    tenant = get_tenant(db, user.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Company not found")

    user.role = user_data.role
    user.is_active = user_data.is_active

    settings = normalize_tenant_settings(tenant.settings)
    tenant.settings = set_user_tabs(
        settings,
        user.id,
        user.role,
        user_data.allowed_tabs,
    )

    db.add(tenant)
    db.commit()
    db.refresh(user)
    attach_tenant(user, tenant)
    return serialize_user(user, tenant)


@router.post("/change-password")
@limiter.limit("5/minute")
def change_password(
    request: Request,
    body: PasswordChange,
    ctx: CurrentTenant,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == ctx.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=400, detail="New password must be at least 8 characters"
        )

    user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.post("/users/{user_id}/set-password")
@limiter.limit("5/minute")
def set_user_password(
    request: Request,
    user_id: str,
    body: PasswordSet,
    ctx: CurrentTenant,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=400, detail="New password must be at least 8 characters"
        )

    if ctx.role == "super_admin":
        pass
    elif ctx.role == "admin":
        if str(user.tenant_id) != ctx.tenant_id:
            raise HTTPException(
                status_code=403, detail="Cannot reset passwords for another company"
            )
        if user.role == "super_admin":
            raise HTTPException(
                status_code=403, detail="Cannot reset super admin passwords"
            )
    else:
        if str(user.id) != str(ctx.user_id):
            raise HTTPException(
                status_code=403, detail="Not allowed to reset another user's password"
            )

    user.hashed_password = get_password_hash(body.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


@router.get("/validate-token", response_model=SessionOut)
@limiter.limit("30/minute")
def validate_token(
    request: Request,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_access_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    tenant = get_tenant(db, user.tenant_id)
    attach_tenant(user, tenant)
    return serialize_session(user, tenant)
