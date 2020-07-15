"""Refactor paths.

Revision ID: 81564a040ccd
Revises: fc8e0d91bf41
Create Date: 2016-08-30 17:30:55.690803

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "81564a040ccd"
down_revision = "fc8e0d91bf41"


def upgrade():
    op.add_column("path", sa.Column("weight", sa.Integer(), nullable=True))
    op.drop_index("ix_path_end_collection_id", table_name="path")
    op.drop_constraint("path_end_collection_id_fkey", "path", type_="foreignkey")
    op.drop_column("path", "end_collection_id")
    col = postgresql.ARRAY(sa.Integer())
    op.add_column("path", sa.Column("end_collection_id", col, nullable=True))


def downgrade():
    pass
