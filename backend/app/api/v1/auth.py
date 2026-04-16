from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import create_access_token, decode_access_token
from db.models import User
from schemas.schemas import UserLogin, UserCreate, Token, UserOut, UserUpdate
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

router = APIRouter()


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


@router.post("/login")
def login(req: UserLogin, db: Session = Depends(get_db)):
    try:
        user = db.query(User).filter(User.email == req.email).first()
        if not user or not verify_password(req.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
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
        }
    except HTTPException:
        raise
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}


@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.email == user_data.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        new_user = User(
            email=user_data.email,
            full_name=user_data.full_name,
            hashed_password=get_password_hash(user_data.password),
            role=user_data.role,
            tenant_id="00000000-0000-0000-0000-000000000001",
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me", response_model=UserOut)
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users", response_model=List[UserOut])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(User).offset(skip).limit(limit).all()


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(user_id: str, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = user_data.role
    user.is_active = user_data.is_active
    db.commit()
    db.refresh(user)
    return user
