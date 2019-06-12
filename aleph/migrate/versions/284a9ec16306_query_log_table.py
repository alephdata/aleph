"""Move from audit model to a simpler query_log table.

Revision ID: 284a9ec16306
Revises: 84683329b0a5
Create Date: 2019-05-09 10:28:18.179679

"""
from alembic import op
import sqlalchemy as sa

revision = '284a9ec16306'
down_revision = '84683329b0a5'


def upgrade():
    op.create_table('query_log',
        sa.Column('id', sa.BigInteger(), nullable=False),  # noqa
        sa.Column('query', sa.Unicode(), nullable=True),
        sa.Column('session_id', sa.String(length=128), nullable=True),
        sa.Column('role_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['role_id'], ['role.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_query_log_role_id'), 'query_log',
                    ['role_id'], unique=False)
    op.drop_index('ix_audit_role_id', table_name='audit')


def downgrade():
    pass
