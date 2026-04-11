from .base import Base, TenantMixin, TimestampMixin
from sqlalchemy import String, Float, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date
import uuid

class Project(Base, TenantMixin, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    dept: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    status: Mapped[str] = mapped_column(String(50), default="active", index=True)
    budget: Mapped[float] = mapped_column(Float, default=0.0)
    spent: Mapped[float] = mapped_column(Float, default=0.0)
    due_date: Mapped[date] = mapped_column(nullable=False)
    owner_id: Mapped[str] = mapped_column(String(36), nullable=True)

class WorkOrder(Base, TenantMixin, TimestampMixin):
    __tablename__ = "work_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    part_name: Mapped[str] = mapped_column(String(255), nullable=False)
    tech: Mapped[str] = mapped_column(String(50), nullable=False)
    material: Mapped[str] = mapped_column(String(100), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String(50), default="planned", index=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal")
    machine_id: Mapped[str] = mapped_column(String(36), nullable=True)
    due_date: Mapped[date] = mapped_column(nullable=False)
    requestor_id: Mapped[str] = mapped_column(String(36), nullable=True)

class PrintRequest(Base, TenantMixin, TimestampMixin):
    __tablename__ = "print_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    stage: Mapped[str] = mapped_column(String(50), default="submitted", index=True)
    tech: Mapped[str] = mapped_column(String(50), nullable=False)
    material: Mapped[str] = mapped_column(String(100), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, default=1)
    print_pct: Mapped[float] = mapped_column(Float, default=0.0)
    request_note: Mapped[str] = mapped_column(Text, nullable=True)
