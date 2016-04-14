"""additional attributes

Revision ID: 4110d04b6b8d
Revises: fa7c1ccb0ac9
Create Date: 2016-04-13 09:34:18.618172

"""

# revision identifiers, used by Alembic.
revision = '4110d04b6b8d'
down_revision = 'fa7c1ccb0ac9'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('entity_other_name', sa.Column('honorific_prefix', sa.Unicode(), nullable=True))
    op.add_column('entity_other_name', sa.Column('honorific_suffix', sa.Unicode(), nullable=True))
    op.add_column('entity_other_name', sa.Column('patronymic_name', sa.Unicode(), nullable=True))

def downgrade():
    op.drop_column('entity_other_name', 'patronymic_name')
    op.drop_column('entity_other_name', 'honorific_suffix')
    op.drop_column('entity_other_name', 'honorific_prefix')
