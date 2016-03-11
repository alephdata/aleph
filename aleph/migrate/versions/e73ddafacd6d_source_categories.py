"""source categories

Revision ID: e73ddafacd6d
Revises: 57e9e4ff269b
Create Date: 2016-03-03 11:52:30.831374

"""

# revision identifiers, used by Alembic.
revision = 'e73ddafacd6d'
down_revision = '57e9e4ff269b'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('source', sa.Column('category', sa.Unicode(), nullable=True))


def downgrade():
    op.drop_column('source', 'category')
