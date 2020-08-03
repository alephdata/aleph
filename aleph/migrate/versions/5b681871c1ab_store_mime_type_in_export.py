"""Store mime_type in Export

Revision ID: 5b681871c1ab
Revises: 5b0cf5636d68
Create Date: 2020-08-03 06:55:35.978985

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "5b681871c1ab"
down_revision = "5b0cf5636d68"


def upgrade():
    op.add_column("export", sa.Column("mime_type", sa.Unicode(), nullable=True))


def downgrade():
    op.drop_column("export", "mime_type")
