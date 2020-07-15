"""init migrations

Revision ID: 57e9e4ff269b
Revises: None
Create Date: 2016-03-03 10:48:05.689514

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "57e9e4ff269b"
down_revision = None


def upgrade():
    op.create_table(
        "source",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("label", sa.Unicode(), nullable=True),
        sa.Column("foreign_id", sa.Unicode(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("foreign_id"),
    )
    op.create_table(
        "role",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("foreign_id", sa.Unicode(length=2048), nullable=False),
        sa.Column("name", sa.Unicode(), nullable=False),
        sa.Column("email", sa.Unicode(), nullable=True),
        sa.Column("api_key", sa.Unicode(), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column(
            "type", sa.Enum("user", "group", "system", name="role_type"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("foreign_id"),
    )
    op.create_table(
        "document",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("content_hash", sa.Unicode(length=65), nullable=False),
        sa.Column("foreign_id", sa.Unicode(), nullable=True),
        sa.Column("type", sa.Unicode(length=10), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("meta", postgresql.JSONB(), nullable=True),
        sa.ForeignKeyConstraint(["source_id"], ["source.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "watchlist",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("label", sa.Unicode(), nullable=True),
        sa.Column("foreign_id", sa.Unicode(), nullable=False),
        sa.Column("creator_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["creator_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("foreign_id"),
    )
    op.create_table(
        "alert",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.Column("signature", sa.Unicode(), nullable=True),
        sa.Column("query", postgresql.JSONB(), nullable=True),
        sa.Column("max_id", sa.BigInteger(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "permission",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=True),
        sa.Column("write", sa.Boolean(), nullable=True),
        sa.Column("resource_id", sa.Integer(), nullable=False),
        sa.Column(
            "resource_type",
            sa.Enum("watchlist", "source", name="permission_type"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "entity",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("foreign_id", sa.Unicode(), nullable=True),
        sa.Column("name", sa.Unicode(), nullable=True),
        sa.Column("data", postgresql.JSONB(), nullable=True),
        sa.Column(
            "category",
            sa.Enum(
                "Person", "Company", "Organization", "Other", name="entity_categories"
            ),
            nullable=False,
        ),
        sa.Column("watchlist_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["watchlist_id"], ["watchlist.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "page",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("number", sa.Integer(), nullable=False),
        sa.Column("text", sa.Unicode(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], ["document.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "selector",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("text", sa.Unicode(), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["entity_id"], ["entity.id"],),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "reference",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.BigInteger(), nullable=True),
        sa.Column("entity_id", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["document_id"], ["document.id"],),
        sa.ForeignKeyConstraint(["entity_id"], ["entity.id"],),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_document_content_hash"), "document", ["content_hash"], unique=False
    )
    op.create_index(
        op.f("ix_document_source_id"), "document", ["source_id"], unique=False
    )
    op.create_index(op.f("ix_document_type"), "document", ["type"], unique=False)
    op.create_index(op.f("ix_selector_text"), "selector", ["text"], unique=False)
    op.create_index(
        op.f("ix_permission_role_id"), "permission", ["role_id"], unique=False
    )
    op.create_index(op.f("ix_alert_role_id"), "alert", ["role_id"], unique=False)


def downgrade():
    op.drop_table("reference")
    op.drop_table("selector")
    op.drop_table("page")
    op.drop_table("entity")
    op.drop_table("permission")
    op.drop_table("alert")
    op.drop_table("watchlist")
    op.drop_table("document")
    op.drop_table("role")
    op.drop_table("source")
    op.drop_index(op.f("ix_permission_role_id"), table_name="permission")
    op.drop_index(op.f("ix_alert_role_id"), table_name="alert")
    op.drop_index(op.f("ix_selector_text"), table_name="selector")
    op.drop_index(op.f("ix_document_type"), table_name="document")
    op.drop_index(op.f("ix_document_source_id"), table_name="document")
    op.drop_index(op.f("ix_document_content_hash"), table_name="document")
