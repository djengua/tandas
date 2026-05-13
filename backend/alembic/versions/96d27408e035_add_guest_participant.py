"""add_guest_participant

Revision ID: 96d27408e035
Revises: 64289bd60156
Create Date: 2026-05-08 16:18:00.734201
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96d27408e035'
down_revision: Union[str, None] = '64289bd60156'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('participants', sa.Column('nombre_invitado', sa.String(length=255), nullable=True))
    op.add_column('participants', sa.Column('email_invitado', sa.String(length=255), nullable=True))
    op.add_column('participants', sa.Column('es_invitado', sa.Boolean(), nullable=True))
    op.execute("UPDATE participants SET es_invitado = false WHERE es_invitado IS NULL")
    op.alter_column('participants', 'es_invitado', nullable=False)
    op.alter_column('participants', 'usuario_id',
               existing_type=sa.UUID(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('participants', 'usuario_id',
               existing_type=sa.UUID(),
               nullable=False)
    op.drop_column('participants', 'es_invitado')
    op.drop_column('participants', 'email_invitado')
    op.drop_column('participants', 'nombre_invitado')
