"""add role column to users

Revision ID: 20250809_01_add_role_to_users
Revises: 20250808_02_merge_heads
Create Date: 2025-08-09
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20250809_01_add_role_to_users"
down_revision = "merge_driver_6aab"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Usar batch mode para SQLite
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(sa.Column("role", sa.String(), nullable=True))

    # Atualizar valores existentes
    op.execute("UPDATE users SET role='USER' WHERE role IS NULL")

    # Criar índice
    op.create_index("ix_users_role", "users", ["role"])


def downgrade() -> None:
    op.drop_index("ix_users_role", table_name="users")
    op.drop_column("users", "role")
