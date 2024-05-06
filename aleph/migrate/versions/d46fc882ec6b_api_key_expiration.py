"""API key expiration

Revision ID: d46fc882ec6b
Revises: c52a1f469ac7
Create Date: 2024-05-02 11:43:50.993948

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "d46fc882ec6b"
down_revision = "c52a1f469ac7"


def upgrade():
    op.add_column("role", sa.Column("api_key_expires_at", sa.DateTime()))
    op.add_column(
        "role", sa.Column("api_key_expiration_notification_sent", sa.Integer())
    )
    op.create_index(
        index_name="ix_role_api_key_expires_at",
        table_name="role",
        columns=["api_key_expires_at"],
    )


def downgrade():
    op.drop_column("role", "api_key_expires_at")
    op.drop_column("role", "api_key_expiration_notification_sent")
