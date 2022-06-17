# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

"""role_id flags

Revision ID: 23c4b0bf13bf
Revises: aac638b04072
Create Date: 2020-05-28 13:20:52.143256

"""
from alembic import op
import sqlalchemy as sa

revision = "23c4b0bf13bf"
down_revision = "aac638b04072"


def upgrade():
    op.alter_column("document", "uploader_id", new_column_name="role_id")
    op.add_column("entity", sa.Column("role_id", sa.Integer(), nullable=True))
    op.create_foreign_key(None, "entity", "role", ["role_id"], ["id"])
    col = sa.Column("disabled", sa.Boolean(), nullable=True)
    op.add_column("mapping", col)


def downgrade():
    pass
