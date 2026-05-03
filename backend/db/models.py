from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class TenantMixin:
    tenant_id = Column(
        UUID(as_uuid=False), ForeignKey("tenants.id"), nullable=False, index=True
    )


class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    name = Column(Text, nullable=False)
    slug = Column(Text, unique=True, nullable=False)
    settings = Column(JSONB, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Project(Base, TenantMixin):
    __tablename__ = "projects"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    custom_id = Column(Text, unique=True)
    name = Column(Text, nullable=False)
    description = Column(Text)
    dept = Column(Text)
    owner_id = Column(Text)
    priority = Column(Text, default="normal")
    status = Column(Text, default="active")
    budget = Column(Numeric(10, 2))
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class WorkOrder(Base, TenantMixin):
    __tablename__ = "work_orders"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    custom_id = Column(Text, unique=True)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), index=True)
    part_name = Column(Text, nullable=False)
    tech = Column(Text)
    material = Column(Text)
    qty = Column(Integer, default=1)
    status = Column(Text, default="planned", index=True)
    machine_id = Column(Text, index=True)
    due_date = Column(Date)
    request_note = Column(Text)
    extra_info = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class PrintRequest(Base, TenantMixin):
    __tablename__ = "print_requests"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    custom_id = Column(Text, unique=True)
    project_id = Column(UUID(as_uuid=False), ForeignKey("projects.id"), index=True)
    title = Column(Text, nullable=False)
    requestor_id = Column(Text)
    tech = Column(Text)
    material = Column(Text)
    qty = Column(Integer)
    priority = Column(Text, default="normal")
    status = Column(Text, default="pending")
    notes = Column(Text)
    image_url = Column(Text)
    stage = Column(Text, default="submitted")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Machine(Base, TenantMixin):
    __tablename__ = "machines"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    custom_id = Column(Text, unique=True)
    name = Column(Text, nullable=False)
    tech = Column(Text)
    status = Column(Text, default="idle", index=True)
    current_job = Column(Text)
    progress_pct = Column(Float, default=0.0)
    oee = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MaterialInventory(Base, TenantMixin):
    __tablename__ = "material_inventory"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    custom_id = Column(Text, unique=True)
    name = Column(Text, nullable=False)
    brand = Column(Text)
    type = Column(Text)
    color = Column(Text)
    color_hex = Column(Text)
    unit = Column(Text, default="spools")
    quantity = Column(Numeric(10, 2), default=0)
    min_quantity = Column(Numeric(10, 2), default=5)
    status = Column(Text, default="ok")
    location = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class NCRReport(Base, TenantMixin):
    __tablename__ = "ncr_reports"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    custom_id = Column(Text, unique=True)
    related_wo_id = Column(UUID(as_uuid=False), ForeignKey("work_orders.id"), index=True)
    reported_by = Column(Text)
    description = Column(Text, nullable=False)
    root_cause_analysis = Column(JSONB)
    corrective_action = Column(Text)
    status = Column(Text, default="open", index=True)
    cost_impact = Column(Numeric(10, 2), default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))


class SparePart(Base, TenantMixin):
    __tablename__ = "spare_parts_inventory"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    custom_id = Column(Text, unique=True)
    name = Column(Text, nullable=False)
    category = Column(Text)
    description = Column(Text)
    quantity = Column(Integer, default=0)
    min_quantity = Column(Integer, default=2)
    location = Column(Text)
    status = Column(Text)  # computed column: 'ok', 'low', 'critical'
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class User(Base, TenantMixin):
    __tablename__ = "users"
    id = Column(
        UUID(as_uuid=False), primary_key=True, server_default=func.gen_random_uuid()
    )
    email = Column(Text, unique=True, index=True, nullable=False)
    full_name = Column(Text)
    avatar_url = Column(Text)
    hashed_password = Column(Text, nullable=False)
    role = Column(Text, default="operator")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
