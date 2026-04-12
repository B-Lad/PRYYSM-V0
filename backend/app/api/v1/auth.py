from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

# Import internal modules
from app.core.database import get_db
from app.core.security import create_access_token
from db.models import User
from schemas.schemas import UserLogin, UserCreate, Token, UserOut

# Password Hashing Setup
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

router = APIRouter()

# --- Helper Functions ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

# --- Endpoints ---

@router.post("/login", response_model=Token)
def login(req: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT."""
    
    # 1. Find user by email
    user = db.query(User).filter(User.email == req.email).first()
    
    # 2. Verify credentials
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Generate Access Token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role, "email": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role
    }

@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    
    # 1. Check if email already exists
    db_user = db.query(User).filter(User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Create new user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        role=user_data.role,
        tenant_id="00000000-0000-0000-0000-000000000001" # Default tenant for now
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.get("/me", response_model=UserOut)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Get current user info from token."""
    from app.core.security import decode_access_token
    
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user
