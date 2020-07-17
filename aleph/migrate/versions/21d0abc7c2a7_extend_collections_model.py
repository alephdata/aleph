"""Extend collections model

Revision ID: 21d0abc7c2a7
Revises: ff8e10fe44d7
Create Date: 2018-04-06 08:56:31.098537

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "21d0abc7c2a7"
down_revision = "ff8e10fe44d7"


def upgrade():
    op.add_column(
        "collection", sa.Column("casefile", sa.Boolean(), nullable=True)
    )  # noqa
    op.add_column(
        "collection", sa.Column("data_url", sa.Unicode(), nullable=True)
    )  # noqa
    op.add_column(
        "collection", sa.Column("info_url", sa.Unicode(), nullable=True)
    )  # noqa
    op.add_column(
        "collection", sa.Column("publisher", sa.Unicode(), nullable=True)
    )  # noqa
    op.add_column(
        "collection", sa.Column("publisher_url", sa.Unicode(), nullable=True)
    )  # noqa

    bind = op.get_bind()
    bind.execute("UPDATE collection SET casefile = NOT managed;")

    op.drop_column("collection", "managed")
    op.add_column(
        "entity", sa.Column("foreign_id", sa.Unicode(), nullable=True)
    )  # noqa
    op.drop_column("entity", "foreign_ids")


def downgrade():
    pass
