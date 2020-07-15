"""Delete source mentions all over the code.

Revision ID: 02603d6949af
Revises: 8b64a94d13a1
Create Date: 2016-06-14 18:46:19.977030

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "02603d6949af"
down_revision = "8b64a94d13a1"


def upgrade():
    op.create_index(
        op.f("ix_crawler_state_collection_id"),
        "crawler_state",
        ["collection_id"],
        unique=False,
    )
    op.drop_index("ix_crawler_state_source_id", table_name="crawler_state")
    op.drop_constraint(
        "crawler_state_source_id_fkey", "crawler_state", type_="foreignkey"
    )
    op.create_foreign_key(
        None, "crawler_state", "collection", ["collection_id"], ["id"]
    )
    op.drop_index("ix_document_source_id", table_name="document")
    op.drop_constraint("document_source_id_fkey", "document", type_="foreignkey")
    op.drop_column("crawler_state", "source_id")
    op.drop_column("document", "source_id")
    # op.alter_column('permission', 'collection_id',
    #                 existing_type=sa.INTEGER(),
    #                 nullable=False)
    op.drop_column("permission", "resource_type")
    op.drop_column("permission", "resource_id")
    op.drop_table("source")


def downgrade():
    raise ValueError("No coming back from this.")
