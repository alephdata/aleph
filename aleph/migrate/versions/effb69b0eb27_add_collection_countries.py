"""Add collection countries

Revision ID: effb69b0eb27
Revises: 81564a040ccd
Create Date: 2016-10-04 14:18:45.928702

"""

# revision identifiers, used by Alembic.
revision = "effb69b0eb27"
down_revision = "81564a040ccd"

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade():
    op.add_column(
        "collection",
        sa.Column("countries", postgresql.ARRAY(sa.Unicode()), nullable=True),
    )
    op.add_column("collection", sa.Column("summary", sa.Unicode(), nullable=True))


def downgrade():
    op.drop_column("collection", "summary")
    op.drop_column("collection", "countries")
