"""entity match

Revision ID: 58f20ece0b91
Revises: 2e46494646ec
Create Date: 2017-07-24 16:59:41.081888

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "58f20ece0b91"
down_revision = "2e46494646ec"


def upgrade():
    op.create_table(
        "match",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("entity_id", sa.String(length=64), nullable=True),
        sa.Column("document_id", sa.BigInteger(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.Column("match_id", sa.String(length=64), nullable=True),
        sa.Column("match_collection_id", sa.Integer(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.ForeignKeyConstraint(["match_collection_id"], ["collection.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_match_collection_id"), "match", ["collection_id"], unique=False
    )
    op.create_index(
        op.f("ix_match_match_collection_id"),
        "match",
        ["match_collection_id"],
        unique=False,
    )


def downgrade():
    pass
