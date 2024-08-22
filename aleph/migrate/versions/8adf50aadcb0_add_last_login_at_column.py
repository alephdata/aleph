"""Add last_login_at column

Revision ID: 8adf50aadcb0
Revises: c52a1f469ac7
Create Date: 2024-08-16 13:01:45.366058

"""

# revision identifiers, used by Alembic.
revision = "8adf50aadcb0"
down_revision = "c52a1f469ac7"

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column("role", sa.Column("last_login_at", sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column("role", "last_login_at")
