"""Add private flag to collections.

Revision ID: 95779b509fe4
Revises: ec74122ed645
Create Date: 2016-07-02 10:41:17.829188

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "95779b509fe4"
down_revision = "ec74122ed645"


def upgrade():
    op.add_column("collection", sa.Column("private", sa.Boolean(), nullable=True))


def downgrade():
    op.drop_column("collection", "private")
