from sqlalchemy import create_engine, Column, String, Boolean, DateTime, func, text
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from app.core.config import settings

# 1. Fix the URL: Remove '+asyncpg' because we are switching to standard sync mode
db_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")

# 2. Create standard engine
engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Define TenantMixin for use in models
class TenantMixin:
    tenant_id = Column(String, nullable=False, index=True)

# Define User model
class User(Base, TenantMixin):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="viewer")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    tenant_id: Mapped[str] = mapped_column(String, nullable=False)

# For SQLite, create the tables
if 'sqlite' in db_url:
    Base.metadata.create_all(bind=engine)

# 3. Standard Dependency (Yields a Session, not an AsyncSession)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
