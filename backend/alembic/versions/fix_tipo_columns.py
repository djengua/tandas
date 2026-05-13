"""fix all tipo columns to string"""

from alembic import op
import sqlalchemy as sa

revision = 'fix_tipo_columns'
down_revision = 'fix_tipo_tanda_type'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column('tandas', 'tipo_periodo', existing_type=sa.Enum('SEMANAL', 'QUINCENAL', 'MENSUAL', name='tipoperiodo'), type_=sa.String(20), postgresql_using='tipo_periodo::text')
    op.alter_column('tandas', 'tipo_tanda', existing_type=sa.Enum('clasico', 'caja_ahorro', name='tipotanda'), type_=sa.String(20), postgresql_using='tipo_tanda::text')


def downgrade() -> None:
    pass