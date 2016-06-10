"""Link documents to collections.

Revision ID: 8b64a94d13a1
Revises: 15a258b73a77
Create Date: 2016-06-10 11:47:07.301063

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '8b64a94d13a1'
down_revision = '15a258b73a77'

ID_OFFSET = 10000


def upgrade():
    op.drop_column(u'entity', 'test')
    op.create_table('collection_document',
                    sa.Column('document_id', sa.BigInteger(), nullable=True),
                    sa.Column('collection_id', sa.Integer(), nullable=True),
                    sa.ForeignKeyConstraint(['collection_id'], ['collection.id'],),
                    sa.ForeignKeyConstraint(['document_id'], ['document.id'], ))
    op.add_column(u'collection',
                  sa.Column('category', sa.Unicode(), nullable=True))
    op.add_column(u'collection',
                  sa.Column('generate_entities', sa.Boolean(), nullable=True))

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    source_table = meta.tables['source']
    colls_table = meta.tables['collection']
    for source in bind.execute(sa.select([source_table])).fetchall():
        source = dict(source)
        source['managed'] = True
        source['id'] = source['id'] + ID_OFFSET
        q = sa.insert(colls_table).values(source)
        bind.execute(q)

    perm_table = meta.tables['permission']
    q = sa.select([perm_table]).where(perm_table.c.resource_type == 'source')
    for perm in bind.execute(q).fetchall():
        perm = dict(perm)
        perm.pop('id')
        perm['resource_type'] = 'collection'
        perm['resource_id'] = perm['resource_id'] + ID_OFFSET
        q = sa.insert(perm_table).values(perm)
        bind.execute(q)

    doc_table = meta.tables['document']
    coll_doc_table = meta.tables['collection_document']
    rp = bind.execute(sa.select([doc_table]))
    refs = []
    while True:
        doc = rp.fetchone()
        if doc is None:
            break
        refs.append({
            'collection_id': doc.source_id + ID_OFFSET,
            'document_id': doc.id
        })
        if len(refs) > 10000:
            op.bulk_insert(coll_doc_table, refs)
            refs = []

    if len(refs):
        op.bulk_insert(coll_doc_table, refs)


def downgrade():
    raise ValueError("No coming back from this.")
