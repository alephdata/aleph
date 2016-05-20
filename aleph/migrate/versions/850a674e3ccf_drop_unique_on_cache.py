"""Drop unique on cache.

Revision ID: 850a674e3ccf
Revises: dfd8b2480e1b
Create Date: 2016-05-20 19:05:42.367783

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = '850a674e3ccf'
down_revision = 'dfd8b2480e1b'


def upgrade():
    op.drop_constraint(u'cache_key_key', 'cache', type_='unique')
    op.create_index(op.f('ix_cache_key'), 'cache', ['key'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_cache_key'), table_name='cache')
    op.create_unique_constraint(u'cache_key_key', 'cache', ['key'])
