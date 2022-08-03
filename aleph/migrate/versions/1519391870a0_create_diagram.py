"""Create Diagram table

Revision ID: aca8cda02c58
Revises: b3ff632002d9
Create Date: 2019-11-27 07:02:11.988577

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "1519391870a0"
down_revision = "b3ff632002d9"


def upgrade():
    op.create_table(
        "diagram",
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(), nullable=True),
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("label", sa.Unicode(), nullable=True),
        sa.Column("summary", sa.Unicode(), nullable=True),
        sa.Column("entities", sa.ARRAY(sa.Unicode()), nullable=True),
        sa.Column("layout", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("role_id", sa.Integer(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(
            ["collection_id"],
            ["collection.id"],
        ),
        sa.ForeignKeyConstraint(
            ["role_id"],
            ["role.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_diagram_collection_id"), "diagram", ["collection_id"], unique=False
    )
    op.create_index(op.f("ix_diagram_role_id"), "diagram", ["role_id"], unique=False)


def downgrade():
    op.drop_index(op.f("ix_diagram_role_id"), table_name="diagram")
    op.drop_index(op.f("ix_diagram_collection_id"), table_name="diagram")
    op.drop_table("diagram")
