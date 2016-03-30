"""rename watchlists

Revision ID: afd5bb9f5004
Revises: b20e873317ab
Create Date: 2016-03-23 23:06:42.135445

"""

# revision identifiers, used by Alembic.
revision = 'afd5bb9f5004'
down_revision = 'b20e873317ab'

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

tmp_type = sa.Enum('collection', 'watchlist', 'source', name='perm_type_coll')
new_type = sa.Enum('collection', 'source', name='permission_type')
old_type = sa.Enum('watchlist', 'source', name='permission_type')


def upgrade():
    bind = op.get_bind()
    op.drop_constraint('watchlist_creator_id_fkey', 'watchlist')
    op.drop_constraint('entity_watchlist_id_fkey', 'entity')
    op.rename_table('watchlist', 'collection')
    op.alter_column('entity', 'watchlist_id', new_column_name='collection_id')
    tmp_type.create(bind, checkfirst=False)
    op.execute('ALTER TABLE permission ALTER COLUMN resource_type TYPE perm_type_coll'
               ' USING resource_type::text::perm_type_coll;')
    op.alter_column('permission', u'resource_type', type_=tmp_type,
                    existing_type=old_type)
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    permission = meta.tables['permission']

    q = sa.update(permission).where(permission.c.resource_type == 'watchlist')
    q = q.values(resource_type='collection')
    op.execute(q)
    old_type.drop(bind, checkfirst=False)
    new_type.create(bind, checkfirst=False)
    op.execute('ALTER TABLE permission ALTER COLUMN resource_type TYPE permission_type'
               ' USING resource_type::text::permission_type;')
    tmp_type.drop(bind, checkfirst=False)
    op.create_foreign_key("collection_creator_id_fkey", "collection", "role",
                          ["creator_id"], ["id"])
    op.create_foreign_key("entity_collection_id_fkey", "entity", "collection",
                          ["collection_id"], ["id"])


def downgrade():
    op.rename_table('collection', 'watchlist')
    op.alter_column('entity', 'collection_id', new_column_name='watchlist_id')
