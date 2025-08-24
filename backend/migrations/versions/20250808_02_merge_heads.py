"""Merge heads driver_ext_001 and 6aab04884e84

Revision ID: merge_driver_6aab
Revises: driver_ext_001, 6aab04884e84
Create Date: 2025-08-08
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "merge_driver_6aab"
down_revision: Union[str, None] = ("driver_ext_001", "6aab04884e84")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:  # pragma: no cover
    # Merge migration - no ops needed
    pass


def downgrade() -> None:  # pragma: no cover
    # Downgrade not practical for a pure merge; keep as pass
    pass
