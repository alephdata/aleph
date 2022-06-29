# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

"""Initialise the database

This was reset with Aleph 3.9. The minimum supported origin version
is Aleph 3.2.

Revision ID: af9b37868cf3
Revises: None
Create Date: 2020-07-31 10:03:53.301493

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "af9b37868cf3"
down_revision = None


def upgrade():
    op.create_table(
        "role",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("foreign_id", sa.Unicode(length=2048), nullable=False),
        sa.Column("name", sa.Unicode(), nullable=False),
        sa.Column("email", sa.Unicode(), nullable=True),
        sa.Column("api_key", sa.Unicode(), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column("is_muted", sa.Boolean(), nullable=False),
        sa.Column(
            "type", sa.Enum("user", "group", "system", name="role_type"), nullable=False
        ),
        sa.Column("password_digest", sa.Unicode(), nullable=True),
        sa.Column("reset_token", sa.Unicode(), nullable=True),
        sa.Column("notified_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("foreign_id"),
    )
    op.create_table(
        "alert",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("query", sa.Unicode(), nullable=True),
        sa.Column("notified_at", sa.DateTime(), nullable=True),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_alert_role_id"), "alert", ["role_id"], unique=False)
    op.create_table(
        "collection",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("label", sa.Unicode(), nullable=True),
        sa.Column("summary", sa.Unicode(), nullable=True),
        sa.Column("category", sa.Unicode(), nullable=True),
        sa.Column("countries", postgresql.ARRAY(sa.Unicode()), nullable=True),
        sa.Column("languages", postgresql.ARRAY(sa.Unicode()), nullable=True),
        sa.Column("foreign_id", sa.Unicode(), nullable=False),
        sa.Column("publisher", sa.Unicode(), nullable=True),
        sa.Column("publisher_url", sa.Unicode(), nullable=True),
        sa.Column("info_url", sa.Unicode(), nullable=True),
        sa.Column("data_url", sa.Unicode(), nullable=True),
        sa.Column("casefile", sa.Boolean(), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["creator_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("foreign_id"),
    )
    op.create_table(
        "notification",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("event", sa.String(length=255), nullable=False),
        sa.Column("channels", postgresql.ARRAY(sa.String(length=255)), nullable=True),
        sa.Column("params", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["actor_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_notification_channels"), "notification", ["channels"], unique=False
    )
    op.create_table(
        "permission",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=True),
        sa.Column("write", sa.Boolean(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_permission_role_id"), "permission", ["role_id"], unique=False
    )
    op.create_table(
        "query_log",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("query", sa.Unicode(), nullable=True),
        sa.Column("session_id", sa.Unicode(), nullable=True),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_query_log_role_id"), "query_log", ["role_id"], unique=False
    )
    op.create_table(
        "role_membership",
        sa.Column("group_id", sa.Integer(), nullable=True),
        sa.Column("member_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["group_id"], ["role.id"],),
        sa.ForeignKeyConstraint(["member_id"], ["role.id"],),
    )
    op.create_table(
        "document",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("content_hash", sa.Unicode(length=65), nullable=True),
        sa.Column("foreign_id", sa.Unicode(), nullable=True),
        sa.Column("schema", sa.String(length=255), nullable=False),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("uploader_id", sa.Integer(), nullable=True),
        sa.Column("parent_id", sa.BigInteger(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.ForeignKeyConstraint(["parent_id"], ["document.id"],),
        sa.ForeignKeyConstraint(["uploader_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_document_collection_id"), "document", ["collection_id"], unique=False
    )
    op.create_index(
        op.f("ix_document_content_hash"), "document", ["content_hash"], unique=False
    )
    op.create_index(
        op.f("ix_document_foreign_id"), "document", ["foreign_id"], unique=False
    )
    op.create_index(
        op.f("ix_document_parent_id"), "document", ["parent_id"], unique=False
    )
    op.create_table(
        "entity",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.String(length=128), nullable=False),
        sa.Column("name", sa.Unicode(), nullable=True),
        sa.Column("schema", sa.String(length=255), nullable=True),
        sa.Column("foreign_id", sa.Unicode(), nullable=True),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_entity_collection_id"), "entity", ["collection_id"], unique=False
    )
    op.create_index(op.f("ix_entity_schema"), "entity", ["schema"], unique=False)
    op.create_table(
        "match",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("entity_id", sa.String(length=128), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.Column("match_id", sa.String(length=128), nullable=True),
        sa.Column("match_collection_id", sa.Integer(), nullable=True),
        sa.Column("score", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.ForeignKeyConstraint(["match_collection_id"], ["collection.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_match_collection_id"), "match", ["collection_id"], unique=False
    )
    op.create_index(
        op.f("ix_match_match_collection_id"),
        "match",
        ["match_collection_id"],
        unique=False,
    )


def downgrade():
    pass
