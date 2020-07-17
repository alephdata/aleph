"""events

Revision ID: 9c92c85163a9
Revises: 666668eae682
Create Date: 2016-05-09 19:04:44.498817

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "9c92c85163a9"
down_revision = "666668eae682"


def upgrade():
    op.create_table(
        "event",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("origin", sa.Unicode(), nullable=True),
        sa.Column("data", postgresql.JSONB(), nullable=True),
        sa.Column(
            "created_at", postgresql.TIMESTAMP(), autoincrement=False, nullable=True
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.drop_table("processing_log")


def downgrade():
    op.create_table(
        "processing_log",
        sa.Column(
            "created_at", postgresql.TIMESTAMP(), autoincrement=False, nullable=True
        ),
        sa.Column(
            "updated_at", postgresql.TIMESTAMP(), autoincrement=False, nullable=True
        ),
        sa.Column("id", sa.BIGINT(), nullable=False),
        sa.Column("operation", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column("component", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column("source_location", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column(
            "content_hash", sa.VARCHAR(length=65), autoincrement=False, nullable=True
        ),
        sa.Column("foreign_id", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column("source_id", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column("document_id", sa.BIGINT(), autoincrement=False, nullable=True),
        sa.Column("meta", postgresql.JSONB(), autoincrement=False, nullable=True),
        sa.Column("error_type", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column("error_message", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.Column("error_details", sa.VARCHAR(), autoincrement=False, nullable=True),
        sa.PrimaryKeyConstraint("id", name="processing_log_pkey"),
    )
    op.drop_table("event")
