"""rename documentpage

Revision ID: e34d28e9a167
Revises: a5ccf5eaa73f
Create Date: 2016-03-08 10:22:16.063105

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "e34d28e9a167"
down_revision = "a5ccf5eaa73f"


def upgrade():
    op.rename_table("page", "document_page")


def downgrade():
    op.rename_table("document_page", "page")
