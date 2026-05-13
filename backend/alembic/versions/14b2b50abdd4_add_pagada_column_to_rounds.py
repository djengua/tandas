"""add_pagada_column_to_rounds

Revision ID: 14b2b50abdd4
Revises: d195aa25be65
Create Date: 2026-05-08 19:50:40.872861
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '14b2b50abdd4'
down_revision: Union[str, None] = 'd195aa25be65'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('rounds', sa.Column('pagada', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade() -> None:
    op.drop_column('rounds', 'pagada')
