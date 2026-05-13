"""add tipo_tanda column to tanda"""

from alembic import op
import sqlalchemy as sa

revision = 'add_tipo_tanda'
down_revision = '14b2b50abdd4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'tandas',
        sa.Column('tipo_tanda', sa.String(20), nullable=False, server_default='clasico')
    )


def downgrade() -> None:
    op.drop_column('tandas', 'tipo_tanda')