"""document uploader

Revision ID: 2e46494646ec
Revises: 580c2c1277d3
Create Date: 2017-06-15 12:02:40.513560

"""
from alembic import op
import sqlalchemy as sa

revision = "2e46494646ec"
down_revision = "580c2c1277d3"


def upgrade():
    op.drop_column("collection", "private")
    op.add_column("document", sa.Column("uploader_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "document", "role", ["uploader_id"], ["id"])
    op.create_foreign_key(None, "document", "document", ["parent_id"], ["id"])


def downgrade():
    pass
