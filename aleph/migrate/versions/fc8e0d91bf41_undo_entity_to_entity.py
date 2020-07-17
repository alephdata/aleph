"""Undo entity-to-entity.

Revision ID: fc8e0d91bf41
Revises: f476428b81b2
Create Date: 2016-08-24 15:55:13.034507

"""
from alembic import op
import sqlalchemy as sa

revision = "fc8e0d91bf41"
down_revision = "f476428b81b2"


def upgrade():
    op.add_column("path", sa.Column("end_collection_id", sa.Integer(), nullable=True))
    op.create_index(
        op.f("ix_path_end_collection_id"), "path", ["end_collection_id"], unique=False
    )
    op.drop_index("ix_path_end_entity_id", table_name="path")
    op.drop_constraint("path_end_entity_id_fkey", "path", type_="foreignkey")
    op.create_foreign_key(None, "path", "collection", ["end_collection_id"], ["id"])
    op.drop_column("path", "end_entity_id")


def downgrade():
    op.add_column(
        "path",
        sa.Column(
            "end_entity_id", sa.VARCHAR(length=32), autoincrement=False, nullable=True
        ),
    )
    op.drop_constraint(None, "path", type_="foreignkey")
    op.create_foreign_key(
        "path_end_entity_id_fkey", "path", "entity", ["end_entity_id"], ["id"]
    )
    op.create_index("ix_path_end_entity_id", "path", ["end_entity_id"], unique=False)
    op.drop_index(op.f("ix_path_end_collection_id"), table_name="path")
    op.drop_column("path", "end_collection_id")
