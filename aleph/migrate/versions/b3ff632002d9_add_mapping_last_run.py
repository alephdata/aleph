"""empty message

Revision ID: b3ff632002d9
Revises: 40d6ffcd8442
Create Date: 2019-10-21 12:32:49.326887

"""

# revision identifiers, used by Alembic.
revision = 'b3ff632002d9'
down_revision = '40d6ffcd8442'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade():
    op.add_column('mapping', sa.Column('last_run_err_msg', sa.Unicode(), nullable=True))
    op.add_column('mapping', sa.Column('last_run_jobid', sa.String(length=128), nullable=True))
    op.add_column('mapping', sa.Column('last_run_status', sa.Unicode(), nullable=True))


def downgrade():
    op.drop_column('mapping', 'last_run_status')
    op.drop_column('mapping', 'last_run_jobid')
    op.drop_column('mapping', 'last_run_err_msg')
