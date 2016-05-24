"""Add managed flag.

Revision ID: 29cad4a9684a
Revises: 850a674e3ccf
Create Date: 2016-05-24 17:37:42.230602

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '29cad4a9684a'
down_revision = '850a674e3ccf'


def upgrade():
    op.add_column('collection', sa.Column('managed', sa.Boolean(),
                  nullable=True))


def downgrade():
    op.drop_column('collection', 'managed')
