"""Create user activity log

Revision ID: 30da16fadab5
Revises: 33228b8da578
Create Date: 2018-07-25 07:53:53.708838

"""

# revision identifiers, used by Alembic.
revision = '30da16fadab5'
down_revision = '33228b8da578'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    op.create_table('user_activity',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('activity_type', sa.Unicode(), nullable=True),
    sa.Column('activity_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=True),
    sa.Column('role_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_user_activity_role_id'), 'user_activity', ['role_id'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_user_activity_role_id'), table_name='user_activity')
    op.drop_table('user_activity')
