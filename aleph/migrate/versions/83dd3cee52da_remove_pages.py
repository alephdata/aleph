"""remove pages

Revision ID: 83dd3cee52da
Revises: 01e0b8a07445
Create Date: 2017-05-16 12:48:51.785409

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '83dd3cee52da'
down_revision = '01e0b8a07445'


def upgrade():
    op.drop_table('document_page')
    op.create_index(op.f('ix_document_record_index'), 'document_record',
                    ['index'], unique=False)
    op.drop_column('document_record', 'row_id')


def downgrade():
    pass
