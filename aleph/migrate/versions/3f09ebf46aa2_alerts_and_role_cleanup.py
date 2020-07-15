"""Alerts and role cleanup

Revision ID: 3f09ebf46aa2
Revises: a1a4f4eccae5
Create Date: 2018-11-12 16:17:28.149428

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "3f09ebf46aa2"
down_revision = "a1a4f4eccae5"


def upgrade():
    op.drop_index("ix_cache_key", table_name="cache")
    op.drop_table("cache")
    op.drop_constraint("alert_entity_id_fkey", "alert", type_="foreignkey")
    op.drop_column("alert", "custom_label")
    op.alter_column("alert", "query_text", new_column_name="query")
    op.drop_column("alert", "entity_id")
    op.add_column("role", sa.Column("is_muted", sa.Boolean(), default=False))


def downgrade():
    pass
