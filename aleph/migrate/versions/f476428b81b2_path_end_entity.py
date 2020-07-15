"""Path end entity.

Revision ID: f476428b81b2
Revises: b050aa239139
Create Date: 2016-08-23 16:17:22.425037

"""
from alembic import op
import sqlalchemy as sa

revision = "f476428b81b2"
down_revision = "b050aa239139"


def upgrade():
    op.add_column(
        "path", sa.Column("end_entity_id", sa.String(length=32), nullable=True)
    )
    op.add_column(
        "path", sa.Column("start_entity_id", sa.String(length=32), nullable=True)
    )
    op.create_index(
        op.f("ix_path_end_entity_id"), "path", ["end_entity_id"], unique=False
    )
    op.create_index(
        op.f("ix_path_start_entity_id"), "path", ["start_entity_id"], unique=False
    )
    op.drop_index("ix_path_end_collection_id", table_name="path")
    op.drop_index("ix_path_entity_id", table_name="path")
    op.drop_constraint("path_end_collection_id_fkey", "path", type_="foreignkey")
    op.create_foreign_key(None, "path", "entity", ["start_entity_id"], ["id"])
    op.create_foreign_key(None, "path", "entity", ["end_entity_id"], ["id"])
    op.drop_column("path", "entity_id")
    op.drop_column("path", "end_collection_id")


def downgrade():
    op.add_column(
        "path",
        sa.Column(
            "end_collection_id", sa.INTEGER(), autoincrement=False, nullable=True
        ),
    )
    op.add_column(
        "path",
        sa.Column(
            "entity_id", sa.VARCHAR(length=255), autoincrement=False, nullable=True
        ),
    )
    op.drop_constraint(None, "path", type_="foreignkey")
    op.drop_constraint(None, "path", type_="foreignkey")
    op.create_foreign_key(
        "path_end_collection_id_fkey",
        "path",
        "collection",
        ["end_collection_id"],
        ["id"],
    )
    op.create_index("ix_path_entity_id", "path", ["entity_id"], unique=False)
    op.create_index(
        "ix_path_end_collection_id", "path", ["end_collection_id"], unique=False
    )
    op.drop_index(op.f("ix_path_start_entity_id"), table_name="path")
    op.drop_index(op.f("ix_path_end_entity_id"), table_name="path")
    op.drop_column("path", "start_entity_id")
    op.drop_column("path", "end_entity_id")
