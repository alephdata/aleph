"""remove paths

Revision ID: ae4b1cec6294
Revises: effb69b0eb27
Create Date: 2016-11-21 10:18:11.802383

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "ae4b1cec6294"
down_revision = "effb69b0eb27"


def upgrade():
    op.drop_table("path")


def downgrade():
    op.create_table(
        "path",
        sa.Column("id", sa.INTEGER(), nullable=False),
        sa.Column("data", postgresql.JSONB(), autoincrement=False, nullable=True),
        sa.Column("length", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column(
            "labels", postgresql.ARRAY(VARCHAR()), autoincrement=False, nullable=True
        ),
        sa.Column(
            "types", postgresql.ARRAY(VARCHAR()), autoincrement=False, nullable=True
        ),
        sa.Column(
            "start_entity_id", sa.VARCHAR(length=32), autoincrement=False, nullable=True
        ),
        sa.Column("weight", sa.INTEGER(), autoincrement=False, nullable=True),
        sa.Column(
            "end_collection_id",
            postgresql.ARRAY(INTEGER()),
            autoincrement=False,
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["start_entity_id"], ["entity.id"], name="path_start_entity_id_fkey"
        ),
        sa.PrimaryKeyConstraint("id", name="path_pkey"),
    )
