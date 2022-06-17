# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

"""Add linkage model to the DB.

Revision ID: aac638b04072
Revises: a8849e4e6784
Create Date: 2019-12-21 19:47:17.878084

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "aac638b04072"
down_revision = "a8849e4e6784"


def upgrade():
    op.create_table(
        "linkage",
        sa.Column("created_at", sa.DateTime(), nullable=True),  # noqa
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("profile_id", sa.String(length=128), nullable=True),
        sa.Column("entity_id", sa.String(length=128), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.Column("decision", sa.Boolean(), nullable=True),
        sa.Column("decider_id", sa.Integer()),
        sa.Column("context_id", sa.Integer()),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.ForeignKeyConstraint(["context_id"], ["role.id"],),
        sa.ForeignKeyConstraint(["decider_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_linkage_collection_id"), "linkage", ["collection_id"], unique=False
    )  # noqa
    op.create_index(
        op.f("ix_linkage_profile_id"), "linkage", ["profile_id"], unique=False
    )  # noqa
    op.create_index(
        op.f("ix_linkage_entity_id"), "linkage", ["entity_id"], unique=False
    )  # noqa


def downgrade():
    op.drop_table("linkage")
