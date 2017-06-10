"""document parents

Revision ID: 6d68a2c945cc
Revises: 83dd3cee52da
Create Date: 2017-06-10 17:25:37.811806

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '6d68a2c945cc'
down_revision = '83dd3cee52da'


def upgrade():
    op.add_column('document', sa.Column('parent_id', sa.BigInteger(),
                  nullable=True))
    op.drop_column('document', 'error_details')
    op.create_index(op.f('ix_entity_state'), 'entity', ['state'], unique=False)
    op.drop_index('role_reset_token', table_name='role')


def downgrade():
    pass
