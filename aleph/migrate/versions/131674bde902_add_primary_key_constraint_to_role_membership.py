"""add primary key constraint to role_membership table

Revision ID: 131674bde902
Revises: 8adf50aadcb0
Create Date: 2024-07-17 14:37:25.269913

"""

# revision identifiers, used by Alembic.
revision = "131674bde902"
down_revision = "8adf50aadcb0"

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.create_primary_key("role_membership_pkey", "role_membership", ["member_id", "group_id"])


def downgrade():
    pass
