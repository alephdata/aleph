"""Added credentials to roles.

Revision ID: 2d230e6ce46d
Revises: 294b8f9f9478
Create Date: 2017-01-26 21:42:52.722454

"""

# revision identifiers, used by Alembic.
revision = '2d230e6ce46d'
down_revision = '294b8f9f9478'

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column('role', sa.Column('password_digest', sa.Unicode))
    op.add_column('role', sa.Column('reset_token', sa.Unicode))

    op.create_index(
        op.f('role_reset_token'), 'role', ['reset_token'], unique=True
    )


def downgrade():
    pass
