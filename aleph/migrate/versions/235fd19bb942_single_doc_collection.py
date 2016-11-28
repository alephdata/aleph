"""single doc collection

Revision ID: 235fd19bb942
Revises: 396b46b5d63d
Create Date: 2016-11-28 22:49:32.351107

"""

# revision identifiers, used by Alembic.
revision = '235fd19bb942'
down_revision = '396b46b5d63d'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


def upgrade():
    op.drop_table('network')
    op.drop_constraint(u'document_source_collection_id_fkey', 'document', type_='foreignkey')
    op.alter_column('document', column_name='source_collection_id', new_column_name='collection_id')
    op.create_index(op.f('ix_document_collection_id'), 'document', ['collection_id'], unique=False)
    op.create_foreign_key(None, 'document', 'collection', ['collection_id'], ['id'])


def downgrade():
    pass
