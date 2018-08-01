"""Add audit table

Revision ID: a1a4f4eccae5
Revises: 30da16fadab5
Create Date: 2018-08-01 07:36:14.020930

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'a1a4f4eccae5'
down_revision = '33228b8da578'


def upgrade():
    op.create_table(
        'audit',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('activity_type', sa.Unicode(), nullable=True),
        sa.Column('activity_metadata', postgresql.JSONB(astext_type=sa.Text()),
                  nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('count', sa.Integer(), nullable=True),
        sa.Column('session_id', sa.Unicode(), nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(
        op.f('ix_audit_role_id'), 'audit', ['role_id'], unique=False
    )


def downgrade():
    op.drop_index(op.f('ix_audit_role_id'), table_name='audit')
    op.drop_table('audit')
