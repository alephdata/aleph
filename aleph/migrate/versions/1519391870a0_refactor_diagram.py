"""Refactor diagram

Revision ID: 1519391870a0
Revises: aca8cda02c58
Create Date: 2019-12-02 08:00:46.428422

"""

# revision identifiers, used by Alembic.
revision = '1519391870a0'
down_revision = 'aca8cda02c58'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.add_column('diagram', sa.Column('entities', sa.ARRAY(sa.Unicode()), nullable=True))
    op.add_column('diagram', sa.Column('label', sa.Unicode(), nullable=True))
    op.add_column('diagram', sa.Column('layout', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('diagram', sa.Column('summary', sa.Unicode(), nullable=True))
    op.drop_column('diagram', 'data')


def downgrade():
    op.add_column('diagram', sa.Column('data', postgresql.JSONB(astext_type=sa.Text()), autoincrement=False, nullable=True))
    op.drop_column('diagram', 'summary')
    op.drop_column('diagram', 'layout')
    op.drop_column('diagram', 'label')
    op.drop_column('diagram', 'entities')
