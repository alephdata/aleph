"""Add path cache.

Revision ID: b050aa239139
Revises: 6c0e33ba7f1d
Create Date: 2016-08-22 17:37:09.343948

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "b050aa239139"
down_revision = "6c0e33ba7f1d"


def upgrade():
    op.create_table(
        "path",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("entity_id", sa.Unicode(length=255), nullable=True),
        sa.Column("data", postgresql.JSONB(), nullable=True),
        sa.Column("length", sa.Integer(), nullable=True),
        sa.Column("labels", postgresql.ARRAY(sa.Unicode()), nullable=True),
        sa.Column("types", postgresql.ARRAY(sa.Unicode()), nullable=True),
        sa.Column("end_collection_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["end_collection_id"], ["collection.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_path_end_collection_id"), "path", ["end_collection_id"], unique=False
    )
    op.create_index(op.f("ix_path_entity_id"), "path", ["entity_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_path_entity_id"), table_name="path")
    op.drop_index(op.f("ix_path_end_collection_id"), table_name="path")
    op.drop_table("path")
