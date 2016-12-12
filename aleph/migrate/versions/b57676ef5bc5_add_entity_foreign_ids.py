"""add entity foreign ids

Revision ID: b57676ef5bc5
Revises: 4212acfa7aec
Create Date: 2016-12-04 15:04:51.989562

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'b57676ef5bc5'
down_revision = '4212acfa7aec'


def upgrade():
    op.add_column('entity', sa.Column('foreign_ids', postgresql.ARRAY(sa.Unicode()), nullable=True))
    op.create_index(op.f('ix_entity_identity_entity_id'), 'entity_identity', ['entity_id'], unique=False)
    op.create_index(op.f('ix_entity_identity_identity'), 'entity_identity', ['identity'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_entity_identity_identity'), table_name='entity_identity')
    op.drop_index(op.f('ix_entity_identity_entity_id'), table_name='entity_identity')
    op.drop_column('entity', 'foreign_ids')
