from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func, Index, String
from typing import Optional
import uuid

class Base(DeclarativeBase):
    pass

class TenantMixin:
    """Enforces row-level tenant isolation on every table"""
    tenant_id: Mapped[str] = mapped_column(
        String(36), 
        nullable=False, 
        index=True,
        comment="Company/Organization ID for data isolation"
    )

class TimestampMixin:
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())