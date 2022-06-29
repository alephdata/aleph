# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

"""Add locale to user roles.

Revision ID: 8a8ef1f7e6fa
Revises: af9b37868cf3
Create Date: 2019-09-20 14:55:32.889654

"""
from alembic import op
import sqlalchemy as sa

revision = "8a8ef1f7e6fa"
down_revision = "af9b37868cf3"


def upgrade():
    op.add_column("role", sa.Column("locale", sa.Unicode(), nullable=True))


def downgrade():
    pass
