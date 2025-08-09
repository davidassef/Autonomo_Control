"""Extender tabela entries com campos específicos de corrida

Revision ID: driver_ext_001
Revises: 6bf5c07f1831
Create Date: 2025-08-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'driver_ext_001'
down_revision: Union[str, None] = '6bf5c07f1831'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


NEW_COLUMNS = [
    ('platform', sa.Column('platform', sa.String(), nullable=True)),
    ('distance_km', sa.Column('distance_km', sa.Float(), nullable=True)),
    ('duration_min', sa.Column('duration_min', sa.Integer(), nullable=True)),
    ('gross_amount', sa.Column('gross_amount', sa.Float(), nullable=True)),
    ('platform_fee', sa.Column('platform_fee', sa.Float(), nullable=True)),
    ('tips_amount', sa.Column('tips_amount', sa.Float(), nullable=True)),
    ('net_amount', sa.Column('net_amount', sa.Float(), nullable=True)),
    ('vehicle_id', sa.Column('vehicle_id', sa.String(), nullable=True)),
    ('shift_tag', sa.Column('shift_tag', sa.String(), nullable=True)),
    ('city', sa.Column('city', sa.String(), nullable=True)),
    ('is_trip_expense', sa.Column('is_trip_expense', sa.Boolean(), nullable=True)),
    ('linked_entry_id', sa.Column('linked_entry_id', sa.String(), nullable=True)),
]

INDEXES = [
    ('ix_entries_type', 'entries', ['type']),
    ('ix_entries_category', 'entries', ['category']),
    ('ix_entries_platform', 'entries', ['platform']),
    ('ix_entries_shift_tag', 'entries', ['shift_tag']),
]

def upgrade() -> None:
    # Add columns
    for name, column in NEW_COLUMNS:
        op.add_column('entries', column)
    # Create indexes (if not exists)
    for index_name, table, cols in INDEXES:
        try:
            op.create_index(index_name, table, cols)  # type: ignore
        except Exception:
            pass


def downgrade() -> None:
    # Drop indexes
    for index_name, table, _ in INDEXES:
        try:
            op.drop_index(index_name, table_name=table)  # type: ignore
        except Exception:
            pass
    # Drop columns (reverse order to avoid deps)
    for name, _ in reversed(NEW_COLUMNS):
        try:
            op.drop_column('entries', name)
        except Exception:
            pass
