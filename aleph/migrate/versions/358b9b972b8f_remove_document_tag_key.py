"""Remove document_tag key.

Revision ID: 358b9b972b8f
Revises: 9209d6b47189
Create Date: 2018-02-01 13:42:49.104911

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "358b9b972b8f"
down_revision = "9209d6b47189"


def upgrade():
    op.drop_index("ix_document_tag_key", table_name="document_tag")
    op.drop_column("document_tag", "key")
    op.alter_column(
        "entity", "schema", existing_type=sa.VARCHAR(length=255), nullable=True
    )
    op.create_index(op.f("ix_entity_schema"), "entity", ["schema"], unique=False)
    op.drop_index("ix_entity_type", table_name="entity")
    op.drop_index("role_reset_token", table_name="role")


def downgrade():
    pass
