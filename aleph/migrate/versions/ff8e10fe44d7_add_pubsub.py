"""add pubsub

Revision ID: ff8e10fe44d7
Revises: e1d41654e85b
Create Date: 2018-03-12 19:24:31.822104

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "ff8e10fe44d7"
down_revision = "e1d41654e85b"


def upgrade():
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
        "subscription",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("channel", sa.String(length=255), nullable=True),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_subscription_channel"), "subscription", ["channel"], unique=False
    )
    op.create_index(
        op.f("ix_subscription_role_id"), "subscription", ["role_id"], unique=False
    )


def downgrade():
    op.drop_index(op.f("ix_subscription_role_id"), table_name="subscription")
    op.drop_index(op.f("ix_subscription_channel"), table_name="subscription")
    op.drop_table("subscription")
    op.drop_index(op.f("ix_notification_channels"), table_name="notification")
    op.drop_table("notification")
