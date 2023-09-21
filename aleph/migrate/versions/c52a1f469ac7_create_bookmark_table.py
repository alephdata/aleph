"""create bookmark table

Revision ID: c52a1f469ac7
Revises: 274270e01613
Create Date: 2023-01-30 08:53:59.370110

"""

# revision identifiers, used by Alembic.
from alembic import op
import sqlalchemy as sa

revision = "c52a1f469ac7"
down_revision = "274270e01613"


def upgrade():
    op.create_table(
        "bookmark",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("role.id"), nullable=False),
        sa.Column("entity_id", sa.String(length=128), nullable=False),
        sa.Column(
            "collection_id",
            sa.Integer(),
            sa.ForeignKey("collection.id"),
            nullable=False,
        ),
        sa.UniqueConstraint("role_id", "entity_id"),
    )

    op.create_index(
        op.f("ix_bookmark_role_id_collection_id_created_at"),
        "bookmark",
        ["role_id", "collection_id", "created_at"],
    )


def downgrade():
    op.drop_table("bookmark")
