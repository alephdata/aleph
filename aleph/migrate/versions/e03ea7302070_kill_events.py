"""Kill events domain object.

Revision ID: e03ea7302070
Revises: cbd285d713b4
Create Date: 2016-05-20 15:38:09.274167

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e03ea7302070'
down_revision = 'cbd285d713b4'


def upgrade():
    op.drop_table('event')


def downgrade():
    op.create_table('event',
    sa.Column('id', sa.BIGINT(), nullable=False),
    sa.Column('origin', sa.VARCHAR(), autoincrement=False, nullable=True),
    sa.Column('data', postgresql.JSONB(), autoincrement=False, nullable=True),
    sa.Column('created_at', postgresql.TIMESTAMP(), autoincrement=False, nullable=True),
    sa.PrimaryKeyConstraint('id', name=u'event_pkey')
    )
