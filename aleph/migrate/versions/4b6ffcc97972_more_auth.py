"""more auth

Revision ID: 4b6ffcc97972
Revises: 4767e3dd1cfa
Create Date: 2015-11-01 17:04:53.472682

"""

# revision identifiers, used by Alembic.
revision = '4b6ffcc97972'
down_revision = '4767e3dd1cfa'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('user', sa.Column('github_id', sa.Unicode(), nullable=True))
    op.add_column('user', sa.Column('google_id', sa.Unicode(), nullable=True))


def downgrade():
    op.drop_column('user', 'google_id')
    op.drop_column('user', 'github_id')
