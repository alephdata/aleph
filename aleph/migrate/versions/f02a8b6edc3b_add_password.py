"""add password

Revision ID: f02a8b6edc3b
Revises: 2d230e6ce46d
Create Date: 2017-02-22 09:36:57.623565

"""

# revision identifiers, used by Alembic.
revision = 'f02a8b6edc3b'
down_revision = '2d230e6ce46d'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('role', sa.Column('password_digest', sa.Unicode(), nullable=True))
    op.add_column('role', sa.Column('reset_token', sa.Unicode(), nullable=True))
    op.alter_column('role', 'foreign_id',
               existing_type=sa.VARCHAR(length=255),
               nullable=False)
    op.create_unique_constraint(None, 'role', ['foreign_id'])


def downgrade():
    op.drop_constraint(None, 'role', type_='unique')
    op.alter_column('role', 'foreign_id',
               existing_type=sa.VARCHAR(length=255),
               nullable=True)
    op.drop_column('role', 'reset_token')
    op.drop_column('role', 'password_digest')
