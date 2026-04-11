from .base import Base, TenantMixin, TimestampMixin
from sqlalchemy import String, Float, Integer, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

class Material(Base, TenantMixin, TimestampMixin):
    __tablename__ = "materials"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # Filament, Resin, Powder
    color: Mapped[str] = mapped_column(String(20), default="#000000")
    code: Mapped[str] = mapped_column(String(50), nullable=True)
    qty: Mapped[float] = mapped_column(Float, default=0.0)
    min_qty: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(20), default="ok", index=True)  # ok, low, critical
    unit: Mapped[str] = mapped_column(String(20), default="spools")  # spools, L, kg

class SparePart(Base, TenantMixin, TimestampMixin):
    __tablename__ = "spare_parts"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # packing, electronics, tools, misc
    description: Mapped[str] = mapped_column(Text, nullable=True)
    qty: Mapped[int] = mapped_column(Integer, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, default=0)
    location: Mapped[str] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="ok", index=True)  # ok, low, critical

class QCRecord(Base, TenantMixin, TimestampMixin):
    __tablename__ = "qc_records"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_order_id: Mapped[str] = mapped_column(String(36), ForeignKey("work_orders.id"), nullable=False, index=True)
    result: Mapped[str] = mapped_column(String(20), nullable=False)  # pass, fail, rework
    defects: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    inspector_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    inspected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    work_order = relationship("WorkOrder", back_populates="qc_records")
    inspector = relationship("User")