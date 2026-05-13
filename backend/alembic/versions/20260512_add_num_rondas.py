"""add_num_rondas_column

Revision ID: add_num_rondas_to_tandas
Revises: 96d27408e035
Create Date: 2026-05-12 18:30:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'add_num_rondas_to_tandas'
down_revision: Union[str, None] = 'fix_tipo_columns'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tandas', sa.Column('num_rondas', sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column('tandas', 'num_rondas')