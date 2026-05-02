"""add_indexes

Revision ID: 460bdb863444
Revises: 9a9aa821c7cd
Create Date: 2026-05-02 22:31:30.941822

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '460bdb863444'
down_revision: Union[str, Sequence[str], None] = '9a9aa821c7cd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Foreign keys and frequently filtered columns
    op.create_index(op.f('ix_machines_status'), 'machines', ['status'], unique=False)
    op.create_index(op.f('ix_work_orders_project_id'), 'work_orders', ['project_id'], unique=False)
    op.create_index(op.f('ix_work_orders_machine_id'), 'work_orders', ['machine_id'], unique=False)
    op.create_index(op.f('ix_work_orders_status'), 'work_orders', ['status'], unique=False)
    op.create_index(op.f('ix_print_requests_project_id'), 'print_requests', ['project_id'], unique=False)
    op.create_index(op.f('ix_ncr_reports_related_wo_id'), 'ncr_reports', ['related_wo_id'], unique=False)
    op.create_index(op.f('ix_ncr_reports_status'), 'ncr_reports', ['status'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ncr_reports_status'), table_name='ncr_reports')
    op.drop_index(op.f('ix_ncr_reports_related_wo_id'), table_name='ncr_reports')
    op.drop_index(op.f('ix_print_requests_project_id'), table_name='print_requests')
    op.drop_index(op.f('ix_work_orders_status'), table_name='work_orders')
    op.drop_index(op.f('ix_work_orders_machine_id'), table_name='work_orders')
    op.drop_index(op.f('ix_work_orders_project_id'), table_name='work_orders')
    op.drop_index(op.f('ix_machines_status'), table_name='machines')
