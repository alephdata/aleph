# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

"""Clean up notifications schema, some other parts.

Revision ID: 2979a1322381
Revises: 2b478162b2b7
Create Date: 2020-03-03 07:32:54.113550

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "2979a1322381"
down_revision = "2b478162b2b7"


def upgrade():
    op.drop_index("ix_notification_channels", table_name="notification")
    op.drop_table("notification")
    op.drop_column("diagram", "data")
    op.drop_constraint("document_parent_id_fkey", "document", type_="foreignkey")
    # op.alter_column('role', 'is_muted',
    #                 existing_type=sa.BOOLEAN(),
    #                 nullable=False)
    op.drop_column("role", "notified_at")


def downgrade():
    pass
