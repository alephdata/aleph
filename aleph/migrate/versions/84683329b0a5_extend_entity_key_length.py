"""extend entity key length

Revision ID: 84683329b0a5
Revises: 3f09ebf46aa2
Create Date: 2019-02-20 07:00:21.047707

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '84683329b0a5'
down_revision = '3f09ebf46aa2'


def upgrade():
    op.drop_column('document_record', 'sheet')
    op.drop_column('match', 'document_id')
    op.alter_column('match', 'entity_id',
                    existing_type=sa.VARCHAR(length=64),
                    type_=sa.String(length=128),
                    existing_nullable=False)
    op.alter_column('match', 'match_id',
                    existing_type=sa.VARCHAR(length=64),
                    type_=sa.String(length=128),
                    existing_nullable=False)
    op.alter_column('entity', 'id',
                    existing_type=sa.VARCHAR(length=32),
                    type_=sa.String(length=128),
                    existing_nullable=False)


def downgrade():
    pass
