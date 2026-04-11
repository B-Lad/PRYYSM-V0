from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class Role(str, enum.Enum):
    ADMIN = "admin"
    EDITOR = "editor"
    VIEWER = "viewer"

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    members = relationship("Member", back_populates="tenant")

class Member(Base):
    __tablename__ = "members"
    id = Column(String, primary_key=True)
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String, nullable=False)
    email = Column(String, nullable=False)
    role = Column(Enum(Role), default=Role.VIEWER)
    tenant = relationship("Tenant", back_populates="members")

# Add tenant_id to ALL operational models (e.g., AILogs, WorkOrders, etc.)
# Example: tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)