from .base import Base, TenantMixin, TimestampMixin
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

class User(Base, TenantMixin, TimestampMixin):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="viewer")  # admin, editor, viewer, operator
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    
    tenant = relationship("Tenant", back_populates="users")
    projects_owned = relationship("Project", foreign_keys="[Project.owner_id]", back_populates="owner")
    work_orders_requested = relationship("WorkOrder", foreign_keys="[WorkOrder.requestor_id]", back_populates="requestor")