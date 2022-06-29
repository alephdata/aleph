# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
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
