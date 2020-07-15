"""Networks.

Revision ID: 6c0e33ba7f1d
Revises: d17d4d4fd1ee
Create Date: 2016-08-20 10:19:56.618884

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "6c0e33ba7f1d"
down_revision = "d17d4d4fd1ee"


def upgrade():
    op.create_table(
        "network",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("label", sa.Unicode(length=255), nullable=True),
        sa.Column("data", postgresql.JSONB(), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.ForeignKeyConstraint(["creator_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_network_collection_id"), "network", ["collection_id"], unique=False
    )


def downgrade():
    op.drop_index(op.f("ix_network_collection_id"), table_name="network")
    op.drop_table("network")
