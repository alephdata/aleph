# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

"""Add data update date stamp to collections table.

Revision ID: 274270e01613
Revises: 5b681871c1ab
Create Date: 2021-05-07 10:06:41.270740

"""
from alembic import op
import sqlalchemy as sa

revision = "274270e01613"
down_revision = "5b681871c1ab"


def upgrade():
    # op.drop_index("ix_query_log_role_id", table_name="query_log")
    # op.drop_table("query_log")
    op.add_column(
        "collection", sa.Column("data_updated_at", sa.DateTime(), nullable=True)
    )


def downgrade():
    pass
