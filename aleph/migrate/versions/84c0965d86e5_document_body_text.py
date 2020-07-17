"""Store the text for non-record documents on the document.

Revision ID: 84c0965d86e5
Revises: 5615d592f571
Create Date: 2017-11-02 15:38:47.649394

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "84c0965d86e5"
down_revision = "5615d592f571"


def upgrade():
    op.add_column("document", sa.Column("body_raw", sa.Unicode(), nullable=True))
    op.add_column("document", sa.Column("body_text", sa.Unicode(), nullable=True))


def downgrade():
    pass
