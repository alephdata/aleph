"""collection languages

Revision ID: 580c2c1277d3
Revises: 9be0f89c9088
Create Date: 2017-06-14 10:13:23.270229

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '580c2c1277d3'
down_revision = '9be0f89c9088'


def upgrade():
    op.add_column('collection', sa.Column('languages', postgresql.ARRAY(sa.Unicode()), nullable=True))  # noqa


def downgrade():
    pass
