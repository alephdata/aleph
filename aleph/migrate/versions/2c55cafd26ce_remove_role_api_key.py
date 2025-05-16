"""Remove role.api_key

Revision ID: 2c55cafd26ce
Revises: 31e24765dee3
Create Date: 2025-05-16 14:10:34.374856

"""

# revision identifiers, used by Alembic.
revision = "2c55cafd26ce"
down_revision = "31e24765dee3"

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.drop_column("role", "api_key")


def downgrade():
    pass
