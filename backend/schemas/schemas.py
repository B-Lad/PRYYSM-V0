from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum
from uuid import UUID


# --- Enums ---
class TechType(str, Enum):
    FDM = "FDM"
    SLA = "SLA"
    SLS = "SLS"


class Priority(str, Enum):
    normal = "normal"
    high = "high"
    urgent = "urgent"


# --- Project Schemas ---
class ProjectCreate(BaseModel):
    name: str
    dept: Optional[str] = None
    priority: Priority = Priority.normal
    budget: Optional[float] = None
    due_date: Optional[str] = None


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID  # CHANGED from str
    custom_id: str
    name: str
    dept: Optional[str]
    priority: Optional[str]
    status: str = "active"
    created_at: datetime
    updated_at: Optional[datetime] = None


# --- Work Order Schemas ---
class WOCreate(BaseModel):
    project_id: str
    part_name: str
    tech: Optional[str] = None
    material: Optional[str] = None
    qty: int = 1
    due_date: Optional[str] = None


class WOOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID  # CHANGED from str
    custom_id: str
    project_id: str
    part_name: str
    tech: Optional[str]
    material: Optional[str]
    qty: int
    status: str = "planned"
    machine_id: Optional[str]
    created_at: datetime


# --- Machine Schemas ---
class MachineOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID  # CHANGED from str
    custom_id: str
    name: str
    tech: Optional[str]
    status: str = "idle"
    current_job: Optional[str]
    progress_pct: float = 0.0
    oee: float = 0.0


# --- Inventory Schemas ---
class MaterialInventoryCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    type: Optional[str] = None
    color: Optional[str] = None
    quantity: float
    min_quantity: float = 5.0
    location: Optional[str] = None


class MaterialInventoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID  # CHANGED from str
    custom_id: str
    name: str
    brand: Optional[str]
    type: Optional[str]
    color: Optional[str]
    color_hex: Optional[str]
    unit: str = "spools"
    quantity: float
    min_quantity: float
    location: Optional[str]


# --- NCR Schemas ---
class NCRCreate(BaseModel):
    related_wo_id: Optional[str] = None
    description: str
    root_cause_analysis: Optional[dict] = None
    corrective_action: Optional[str] = None
    cost_impact: float = 0.0


class NCRBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID  # CHANGED from str
    custom_id: str
    description: str
    status: str = "open"
    created_at: datetime


# ==============================================================================
# AUTHENTICATION & USER SCHEMAS
# ==============================================================================


class UserLogin(BaseModel):
    email: str
    password: str


class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str
    role: str = "operator"
    tenant_id: Optional[str] = None
    allowed_tabs: List[str] = []


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    tenant_id: Optional[str] = None
    user_id: Optional[str] = None


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool = True
    tenant_id: Optional[str] = None
    allowed_tabs: List[str] = []


class UserUpdate(BaseModel):
    role: str
    is_active: bool
    allowed_tabs: Optional[List[str]] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class PasswordSet(BaseModel):
    new_password: str


class TenantCreate(BaseModel):
    name: str
    slug: str
    contact_email: Optional[str] = None
    admin_email: str
    admin_password: str
    max_users: int = 5
    max_machines: int = 2


class TenantOut(BaseModel):
    id: str
    name: str
    slug: str
    contact_email: Optional[str] = None
    max_users: int = 5
    max_machines: int = 2
    created_at: Optional[datetime] = None


class TenantUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    contact_email: Optional[str] = None
    max_users: Optional[int] = None
    max_machines: Optional[int] = None


class SessionOut(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    role: str
    tenant_id: Optional[str] = None
    is_active: bool = True
    allowed_tabs: List[str] = []
    tenant_name: Optional[str] = None
    max_users: Optional[int] = None
    max_machines: Optional[int] = None


class AccessOptionsOut(BaseModel):
    all_tabs: List[str]
    assignable_tabs: List[str]
