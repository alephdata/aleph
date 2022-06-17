# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

"""Add collection some fields.

Revision ID: 8dff301e1b1f
Revises: 23c4b0bf13bf
Create Date: 2020-06-15 19:41:23.953882

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "8dff301e1b1f"
down_revision = "23c4b0bf13bf"


def upgrade():
    op.add_column(
        "collection", sa.Column("frequency", sa.Unicode(), nullable=True)
    )  # noqa
    op.add_column(
        "collection", sa.Column("restricted", sa.Boolean(), nullable=True)
    )  # noqa
    op.add_column("collection", sa.Column("xref", sa.Boolean(), nullable=True))  # noqa


def downgrade():
    pass
