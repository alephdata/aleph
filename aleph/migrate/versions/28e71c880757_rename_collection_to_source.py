"""rename collection to source

Revision ID: 28e71c880757
Revises: 2fbdba0f3aa6
Create Date: 2015-03-10 18:37:29.731676

"""

# revision identifiers, used by Alembic.
revision = '28e71c880757'
down_revision = '2fbdba0f3aa6'

from alembic import op


def upgrade():
    op.rename_table('collection', 'source')
    op.rename_table('collection_user', 'source_user')
    op.alter_column('source_user', 'collection_slug',
                    new_column_name='source_slug')


def downgrade():
    pass
