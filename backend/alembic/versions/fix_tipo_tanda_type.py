"""fix tipo_tanda column type"""

from alembic import op
import sqlalchemy as sa

revision = 'fix_tipo_tanda_type'
down_revision = 'add_tipo_tanda'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('tandas', 'tipo_tanda', existing_type=sa.Enum('clasico', 'caja_ahorro', name='tipotanda'), type_=sa.String(20), postgresql_using='tipo_tanda::text')


def downgrade() -> None:
    pass