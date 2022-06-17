# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

"""Hard delete various model types.

Revision ID: aa486b9e627e
Revises: 9dcef7592cea
Create Date: 2020-07-31 08:56:43.679019

"""
from alembic import op
import sqlalchemy as sa

revision = "aa486b9e627e"
down_revision = "9dcef7592cea"


def upgrade():
    meta = sa.MetaData()
    meta.bind = op.get_bind()
    meta.reflect()
    for table_name in ("alert", "entity", "mapping", "permission"):
        table = meta.tables[table_name]
        q = sa.delete(table).where(table.c.deleted_at != None)  # noqa
        meta.bind.execute(q)
    table = meta.tables["permission"]
    q = sa.delete(table).where(table.c.read == False)  # noqa
    meta.bind.execute(q)

    op.drop_column("alert", "deleted_at")
    op.drop_column("entity", "deleted_at")
    op.drop_column("mapping", "deleted_at")
    op.drop_column("permission", "deleted_at")
    op.alter_column("entityset", "label", existing_type=sa.VARCHAR(), nullable=True)
    op.alter_column("role", "is_muted", existing_type=sa.BOOLEAN(), nullable=False)


def downgrade():
    pass
