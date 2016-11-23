"""add role membership

Revision ID: 396b46b5d63d
Revises: 0d710334ddd1
Create Date: 2016-11-23 12:09:12.063452

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '396b46b5d63d'
down_revision = '0d710334ddd1'


def upgrade():
    op.create_table('role_membership',
        sa.Column('group_id', sa.Integer(), nullable=True),
        sa.Column('member_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['group_id'], ['role.id'], ),
        sa.ForeignKeyConstraint(['member_id'], ['role.id'], )
    )


def downgrade():
    op.drop_table('role_membership')
