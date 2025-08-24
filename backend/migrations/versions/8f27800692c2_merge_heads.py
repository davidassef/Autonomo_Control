"""Merge heads

Revision ID: 8f27800692c2
Revises: 20250809_01_add_role_to_users, add_username_secret_keys
Create Date: 2025-08-13 19:18:19.641107

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "8f27800692c2"
down_revision: Union[str, None] = (
    "20250809_01_add_role_to_users",
    "add_username_secret_keys",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
