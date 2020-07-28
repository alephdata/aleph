"""rename export_op

Revision ID: 5b0cf5636d68
Revises: ad3b9bb23755
Create Date: 2020-07-28 11:34:19.330874

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "5b0cf5636d68"
down_revision = "ad3b9bb23755"


def upgrade():
    op.add_column("export", sa.Column("operation", sa.Unicode(), nullable=True))
    op.drop_column("export", "export_op")


def downgrade():
    op.add_column(
        "export",
        sa.Column("export_op", sa.VARCHAR(), autoincrement=False, nullable=True),
    )
    op.drop_column("export", "operation")
