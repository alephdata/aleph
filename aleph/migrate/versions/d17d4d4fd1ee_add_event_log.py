"""Add event log.

Revision ID: d17d4d4fd1ee
Revises: 95779b509fe4
Create Date: 2016-07-22 12:21:14.296489

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "d17d4d4fd1ee"
down_revision = "95779b509fe4"


def upgrade():
    op.create_table(
        "event_log",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("action", sa.Unicode(length=255), nullable=True),
        sa.Column("source_ip", sa.Unicode(length=255), nullable=True),
        sa.Column("path", sa.Unicode(), nullable=True),
        sa.Column("query", postgresql.JSONB(), nullable=True),
        sa.Column("data", postgresql.JSONB(), nullable=True),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["role_id"], ["role.id"],),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_event_log_action"), "event_log", ["action"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_event_log_action"), table_name="event_log")
    op.drop_table("event_log")
