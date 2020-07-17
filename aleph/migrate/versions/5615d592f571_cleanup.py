"""Cleanup of various deprecated data elements.

Revision ID: 5615d592f571
Revises: 58f20ece0b91
Create Date: 2017-11-01 10:41:52.145075

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "5615d592f571"
down_revision = "58f20ece0b91"


def upgrade():
    op.drop_table("entity_identity")
    op.drop_table("reference")
    op.drop_table("link")
    op.create_index(
        op.f("ix_document_foreign_id"), "document", ["foreign_id"], unique=False
    )
    op.create_index(
        op.f("ix_document_parent_id"), "document", ["parent_id"], unique=False
    )
    op.drop_index("ix_document_crawler", table_name="document")
    op.drop_index("ix_document_status", table_name="document")
    op.drop_index("ix_document_type", table_name="document")
    op.drop_column("document", "error_type")
    op.drop_column("document", "crawler_run")
    op.drop_column("document", "crawler")
    op.drop_index("ix_entity_state", table_name="entity")
    op.drop_column("entity", "state")
