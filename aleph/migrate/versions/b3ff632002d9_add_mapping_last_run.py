# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

"""Add last run info to mapping table

Revision ID: b3ff632002d9
Revises: 40d6ffcd8442
Create Date: 2019-10-21 12:32:49.326887

"""
from alembic import op
import sqlalchemy as sa

revision = "b3ff632002d9"
down_revision = "40d6ffcd8442"


def upgrade():
    op.add_column(
        "mapping", sa.Column("last_run_err_msg", sa.Unicode(), nullable=True)
    )  # noqa
    op.add_column(
        "mapping", sa.Column("last_run_status", sa.Unicode(), nullable=True)
    )  # noqa


def downgrade():
    op.drop_column("mapping", "last_run_status")
    op.drop_column("mapping", "last_run_err_msg")
