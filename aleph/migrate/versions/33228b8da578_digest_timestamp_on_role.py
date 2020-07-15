"""Add digest notification timestamp on role.

Revision ID: 33228b8da578
Revises: 21d0abc7c2a7
Create Date: 2018-04-26 13:45:06.436799

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "33228b8da578"
down_revision = "21d0abc7c2a7"


def upgrade():
    col = sa.Column("notified_at", sa.DateTime(), nullable=True)
    op.add_column("role", col)


def downgrade():
    op.drop_column("role", "notified_at")
