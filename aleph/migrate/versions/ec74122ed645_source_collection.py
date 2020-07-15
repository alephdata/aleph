"""Source collection.

Revision ID: ec74122ed645
Revises: 02603d6949af
Create Date: 2016-06-21 11:40:49.312974

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "ec74122ed645"
down_revision = "02603d6949af"


def upgrade():
    op.execute("DELETE FROM permission WHERE collection_id IS NULL;")
    op.add_column(
        "document", sa.Column("source_collection_id", sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        None, "document", "collection", ["source_collection_id"], ["id"]
    )
    op.alter_column(
        "permission", "collection_id", existing_type=sa.INTEGER(), nullable=False
    )

    op.execute(
        """
      UPDATE document SET source_collection_id = cd.collection_id
        FROM collection_document cd WHERE cd.document_id = document.id;
    """
    )


def downgrade():
    op.alter_column(
        "permission", "collection_id", existing_type=sa.INTEGER(), nullable=True
    )
    op.drop_constraint(None, "document", type_="foreignkey")
    op.drop_column("document", "source_collection_id")
