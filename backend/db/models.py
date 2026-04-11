from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, Text, JSON, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
import uuid
from db.base import Base, TenantMixin

# --- Enums ---
class TechType(str, enum.Enum):
    FDM = "FDM"
    SLA = "SLA"
    SLS = "SLS"

class ProjectPriority(str, enum.Enum):
    normal = "normal"
    high = "high"
    urgent = "urgent"

class MachineStatus(str, enum.Enum):
    idle = "idle"
    running = "running"
    error = "error"
    maintenance = "maintenance"
    offline = "offline"

# --- Models ---

class Project(Base, TenantMixin):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False) # e.g., PRJ-011
    name = Column(String(255), nullable=False)
    description = Column(Text)
    dept = Column(String(50))
    owner_id = Column(String(36), ForeignKey("user_profiles.id"))
    priority = Column(Enum(ProjectPriority), default=ProjectPriority.normal)
    status = Column(String(50), default="active")
    budget = Column(Numeric(10, 2))
    spent = Column(Numeric(10, 2), default=0)
    due_date = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    work_orders = relationship("WorkOrder", back_populates="project")

class WorkOrder(Base, TenantMixin):
    __tablename__ = "work_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False) # e.g., WO-2041
    project_id = Column(String(36), ForeignKey("projects.id"))
    part_name = Column(String(255), nullable=False)
    tech = Column(Enum(TechType))
    material = Column(String(100))
    qty = Column(Integer, default=1)
    status = Column(String(50), default="planned")
    machine_id = Column(String(50))
    operator_id = Column(String(36), ForeignKey("user_profiles.id"))
    due_date = Column(DateTime)
    request_note = Column(Text)
    extra_info = Column(JSON) # Stores AM Review data
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="work_orders")

class PrintRequest(Base, TenantMixin):
    __tablename__ = "print_requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"))
    title = Column(String(255), nullable=False)
    requestor_id = Column(String(36), ForeignKey("user_profiles.id"))
    tech = Column(Enum(TechType))
    material = Column(String(100))
    qty = Column(Integer)
    priority = Column(Enum(ProjectPriority), default=ProjectPriority.normal)
    status = Column(String(50), default="pending")
    notes = Column(Text)
    image_url = Column(String(500))
    stage = Column(String(50), default="submitted")
    groups_data = Column(JSON) # Material groups
    history_log = Column(JSON) # Lifecycle history
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Machine(Base, TenantMixin):
    __tablename__ = "machines"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    model = Column(String(255))
    tech = Column(Enum(TechType))
    work_center_id = Column(String(36), ForeignKey("work_centers.id"))
    status = Column(Enum(MachineStatus), default=MachineStatus.idle)
    current_job = Column(String(50))
    progress_pct = Column(Float, default=0.0)
    est_remaining = Column(String(50))
    oee = Column(Float, default=0.0)
    availability = Column(Float, default=0.0)
    performance = Column(Float, default=0.0)
    quality = Column(Float, default=0.0)
    last_maintenance = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MaterialInventory(Base, TenantMixin):
    __tablename__ = "material_inventory"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    brand = Column(String(100))
    type = Column(String(100))
    finish = Column(String(50))
    color = Column(String(50))
    color_hex = Column(String(10))
    unit = Column(String(20), default="spools")
    quantity = Column(Numeric(10, 2), default=0)
    min_quantity = Column(Numeric(10, 2), default=5)
    location = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class NCRReport(Base, TenantMixin):
    __tablename__ = "ncr_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    custom_id = Column(String(50), unique=True, nullable=False)
    related_wo_id = Column(String(36), ForeignKey("work_orders.id"))
    reported_by = Column(String(36), ForeignKey("user_profiles.id"))
    description = Column(Text, nullable=False)
    root_cause_analysis = Column(JSON)
    corrective_action = Column(Text)
    status = Column(String(50), default="open")
    cost_impact = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
