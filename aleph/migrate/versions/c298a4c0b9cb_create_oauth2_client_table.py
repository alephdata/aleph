"""create oauth2_client table

Revision ID: c298a4c0b9cb
Revises: c52a1f469ac7
Create Date: 2023-07-31 10:43:55.330921

"""

# revision identifiers, used by Alembic.
from alembic import op
import sqlalchemy as sa

revision = "c298a4c0b9cb"
down_revision = "c52a1f469ac7"


def upgrade():
    op.create_table(
        "oauth2_client",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("client_id", sa.String(48), index=True, unique=True, nullable=False),
        sa.Column("client_secret", sa.String(120)),
        sa.Column("client_id_issued_at", sa.Integer, nullable=False, default=0),
        sa.Column("client_secret_expires_at", sa.Integer, nullable=False, default=0),
        sa.Column("client_metadata", sa.Text),
    )


def downgrade():
    op.drop_table("oauth2_client")
