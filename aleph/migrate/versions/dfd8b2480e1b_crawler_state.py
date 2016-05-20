"""Crawler state.

Revision ID: dfd8b2480e1b
Revises: e03ea7302070
Create Date: 2016-05-20 16:16:07.886089

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'dfd8b2480e1b'
down_revision = 'e03ea7302070'


def upgrade():
    op.create_table('crawler_state',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('crawler_id', sa.Unicode(), nullable=True),
    sa.Column('crawler_run', sa.Unicode(), nullable=True),
    sa.Column('content_hash', sa.Unicode(length=65), nullable=True),
    sa.Column('foreign_id', sa.Unicode(), nullable=True),
    sa.Column('status', sa.Unicode(length=10), nullable=False),
    sa.Column('error_type', sa.Unicode(), nullable=True),
    sa.Column('error_message', sa.Unicode(), nullable=True),
    sa.Column('error_details', sa.Unicode(), nullable=True),
    sa.Column('meta', postgresql.JSONB(), nullable=True),
    sa.Column('source_id', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['source_id'], ['source.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_crawler_state_crawler_id'), 'crawler_state', ['crawler_id'], unique=False)
    op.create_index(op.f('ix_crawler_state_source_id'), 'crawler_state', ['source_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_crawler_state_source_id'), table_name='crawler_state')
    op.drop_index(op.f('ix_crawler_state_crawler_id'), table_name='crawler_state')
    op.drop_table('crawler_state')
