from .base import Base, TimestampMixin
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True)
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    
    # Relationships
    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    machines = relationship("Machine", back_populates="tenant", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="tenant", cascade="all, delete-orphan")