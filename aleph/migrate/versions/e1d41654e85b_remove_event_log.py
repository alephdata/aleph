"""remove event log

Revision ID: e1d41654e85b
Revises: ea39c04daca4
Create Date: 2018-03-07 15:33:34.299841

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = "e1d41654e85b"
down_revision = "ea39c04daca4"


def upgrade():
    op.drop_constraint("event_log_role_id_fkey", "event_log", type_="foreignkey")
    op.drop_table("event_log")


def downgrade():
    pass
