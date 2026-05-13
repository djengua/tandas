"""add_pagada_to_round_estado

Revision ID: d195aa25be65
Revises: bc63a7d32eae
Create Date: 2026-05-08 19:26:52.336967
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd195aa25be65'
down_revision: Union[str, None] = 'bc63a7d32eae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE estadoronda ADD VALUE 'pagada'")


def downgrade() -> None:
    op.execute("ALTER TYPE estadoronda RENAME VALUE 'pagada' TO _deprecated_pagada")
