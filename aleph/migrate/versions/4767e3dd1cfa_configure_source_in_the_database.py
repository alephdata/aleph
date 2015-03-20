"""configure source in the database

Revision ID: 4767e3dd1cfa
Revises: 28e71c880757
Create Date: 2015-03-20 10:49:59.772556

"""

# revision identifiers, used by Alembic.
revision = '4767e3dd1cfa'
down_revision = '28e71c880757'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('source', sa.Column('crawler', sa.Unicode(), nullable=True))
    if op.get_bind().dialect.name == 'postgresql':
        from sqlalchemy.dialects.postgresql import JSON
        op.add_column('source', sa.Column('config', JSON, nullable=True))
    else:
        op.add_column('source', sa.Column('config', sa.Unicode(), nullable=True))
    op.drop_column('source', 'token')
    op.execute("UPDATE source SET config = '{}';")


def downgrade():
    pass
