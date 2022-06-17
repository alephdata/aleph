# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

"""role flags

Revision ID: 2b478162b2b7
Revises: b3959bf8cc66
Create Date: 2020-02-07 10:30:54.237224

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "2b478162b2b7"
down_revision = "b3959bf8cc66"


def upgrade():
    op.add_column("role", sa.Column("is_blocked", sa.Boolean(), nullable=True))
    op.add_column("role", sa.Column("is_tester", sa.Boolean(), nullable=True))
    op.execute("UPDATE role SET is_blocked = false, is_tester = false")
    op.alter_column("role", "is_blocked", nullable=False)
    op.alter_column("role", "is_tester", nullable=False)


def downgrade():
    pass
