# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

"""Remove the match table.

Revision ID: a8849e4e6784
Revises: 2979a1322381
Create Date: 2020-03-14 20:16:35.882396

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "a8849e4e6784"
down_revision = "2979a1322381"


def upgrade():
    op.drop_index("ix_match_collection_id", table_name="match")
    op.drop_index("ix_match_match_collection_id", table_name="match")
    op.drop_table("match")


def downgrade():
    pass
