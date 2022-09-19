"""Introduce Export model

Revision ID: 5b681871c1ab
Revises: 18f53aae83ae
Create Date: 2020-07-28 11:26:26.392701

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "5b681871c1ab"
down_revision = "18f53aae83ae"


def upgrade():
    op.create_table(
        "export",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("label", sa.Unicode(), nullable=True),
        sa.Column("operation", sa.Unicode(), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("deleted", sa.Boolean(), nullable=True),
        sa.Column("export_status", sa.Unicode(), nullable=True),
        sa.Column("content_hash", sa.Unicode(length=65), nullable=True),
        sa.Column("file_size", sa.BigInteger(), nullable=True),
        sa.Column("file_name", sa.Unicode(), nullable=True),
        sa.Column("mime_type", sa.Unicode(), nullable=True),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(
            ["collection_id"],
            ["collection.id"],
        ),
        sa.ForeignKeyConstraint(
            ["creator_id"],
            ["role.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_export_collection_id"), "export", ["collection_id"], unique=False
    )
    op.create_index(
        op.f("ix_export_content_hash"), "export", ["content_hash"], unique=False
    )


def downgrade():
    op.drop_index(op.f("ix_export_content_hash"), table_name="export")
    op.drop_index(op.f("ix_export_collection_id"), table_name="export")
    op.drop_table("export")
