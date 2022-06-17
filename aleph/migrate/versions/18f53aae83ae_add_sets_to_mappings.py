# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

"""Add entitysets to mappings

Revision ID: 18f53aae83ae
Revises: aa486b9e627e
Create Date: 2020-08-28 10:08:57.047016

"""
from alembic import op
import sqlalchemy as sa

revision = "18f53aae83ae"
down_revision = "aa486b9e627e"


def upgrade():
    op.add_column(
        "mapping", sa.Column("entityset_id", sa.String(length=128), nullable=True)
    )
    op.create_foreign_key(None, "mapping", "entityset", ["entityset_id"], ["id"])


def downgrade():
    pass
