"""ocr cache

Revision ID: 8d8c050d3eca
Revises: 9c92c85163a9
Create Date: 2016-05-12 18:52:33.968021

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8d8c050d3eca'
down_revision = '9c92c85163a9'


def upgrade():
    op.create_table('cache',
    sa.Column('id', sa.BigInteger(), nullable=False),
    sa.Column('key', sa.Unicode(), nullable=True),
    sa.Column('value', sa.Unicode(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('key')
    )


def downgrade():
    op.drop_table('cache')
