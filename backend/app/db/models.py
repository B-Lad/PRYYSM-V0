from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Numeric
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func
import uuid

# Define Base here so we don't need to import it
Base = declarative_base()

class TenantMixin:
    tenant_id = Column(String, nullable=False, index=True)

class Project(Base, TenantMixin):
    __tablename__ = "projects"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    dept = Column(String(50))
    owner_id = Column(String(50))
    priority = Column(String(50), default="normal")
    status = Column(String(50), default="active")
    budget = Column(Numeric(10, 2))
    due_date = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class WorkOrder(Base, TenantMixin):
    __tablename__ = "work_orders"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    project_id = Column(String, ForeignKey("projects.id"))
    part_name = Column(String(255), nullable=False)
    tech = Column(String(50))
    material = Column(String(100))
    qty = Column(Integer, default=1)
    status = Column(String(50), default="planned")
    machine_id = Column(String(50))
    due_date = Column(DateTime)
    request_note = Column(Text)
    extra_info = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class PrintRequest(Base, TenantMixin):
    __tablename__ = "print_requests"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    project_id = Column(String, ForeignKey("projects.id"))
    title = Column(String(255), nullable=False)
    requestor_id = Column(String(50))
    tech = Column(String(50))
    material = Column(String(100))
    qty = Column(Integer)
    priority = Column(String(50), default="normal")
    status = Column(String(50), default="pending")
    notes = Column(Text)
    image_url = Column(String(500))
    stage = Column(String(50), default="submitted")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Machine(Base, TenantMixin):
    __tablename__ = "machines"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    tech = Column(String(50))
    status = Column(String(50), default="idle")
    current_job = Column(String(50))
    progress_pct = Column(Float, default=0.0)
    oee = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MaterialInventory(Base, TenantMixin):
    __tablename__ = "material_inventory"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    brand = Column(String(100))
    type = Column(String(100))
    color = Column(String(50))
    color_hex = Column(String(10))
    unit = Column(String(20), default="spools")
    quantity = Column(Numeric(10, 2), default=0)
    min_quantity = Column(Numeric(10, 2), default=5)
    status = Column(String(20), default="ok")
    location = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NCRReport(Base, TenantMixin):
    __tablename__ = "ncr_reports"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    related_wo_id = Column(String, ForeignKey("work_orders.id"))
    reported_by = Column(String(50))
    description = Column(Text, nullable=False)
    root_cause_analysis = Column(JSON)
    corrective_action = Column(Text)
    status = Column(String(50), default="open")
    cost_impact = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
