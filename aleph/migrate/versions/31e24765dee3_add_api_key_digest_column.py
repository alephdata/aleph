"""Add api_key_digest column

Revision ID: 31e24765dee3
Revises: d46fc882ec6b
Create Date: 2024-07-04 11:07:19.915782

"""

# revision identifiers, used by Alembic.
revision = "31e24765dee3"
down_revision = "d46fc882ec6b"

from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column("role", sa.Column("api_key_digest", sa.Unicode()))
    op.create_index(
        index_name="ix_role_api_key_digest",
        table_name="role",
        columns=["api_key_digest"],
        unique=True,
    )


def downgrade():
    op.drop_column("role", "api_key_digest")
