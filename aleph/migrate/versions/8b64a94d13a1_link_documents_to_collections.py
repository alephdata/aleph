"""Link documents to collections.

Revision ID: 8b64a94d13a1
Revises: 15a258b73a77
Create Date: 2016-06-10 11:47:07.301063

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "8b64a94d13a1"
down_revision = "15a258b73a77"


def upgrade():
    op.create_table(
        "collection_document",
        sa.Column("document_id", sa.BigInteger(), nullable=True),
        sa.Column("collection_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["collection_id"], ["collection.id"],),
        sa.ForeignKeyConstraint(["document_id"], ["document.id"],),
    )
    op.add_column("collection", sa.Column("category", sa.Unicode(), nullable=True))
    op.add_column(
        "collection", sa.Column("generate_entities", sa.Boolean(), nullable=True)
    )
    op.add_column(
        "crawler_state", sa.Column("collection_id", sa.Integer(), nullable=True)
    )
    op.add_column("permission", sa.Column("collection_id", sa.Integer(), nullable=True))

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    source_table = meta.tables["source"]
    colls_table = meta.tables["collection"]
    bind.execute(sa.update(colls_table).values(category="watchlist"))

    id_map = {}

    for source in bind.execute(sa.select([source_table])).fetchall():
        source = dict(source)
        source["managed"] = True
        source_id = source.pop("id")
        q = sa.insert(colls_table).values(source)
        rp = bind.execute(q)
        new_id = rp.inserted_primary_key.pop()
        id_map[source_id] = new_id

    print("Re-writing permissions...")
    perm_table = meta.tables["permission"]
    q = sa.select([perm_table]).where(perm_table.c.resource_type == "source")
    for perm in bind.execute(q).fetchall():
        perm = dict(perm)
        perm.pop("id")
        if perm["resource_id"] in id_map:
            perm["resource_type"] = "collection"
            perm["resource_id"] = id_map[perm["resource_id"]]
            q = sa.insert(perm_table).values(perm)
            bind.execute(q)

    q = sa.select([perm_table]).where(perm_table.c.resource_type == "collection")
    for perm in bind.execute(q).fetchall():
        q = sa.update(perm_table).where(perm_table.c.id == perm.id)
        q = q.values(collection_id=perm.resource_id)
        bind.execute(q)

    # q = sa.delete(perm_table).where(perm_table.c.resource_type == 'source')
    # bind.execute(q)

    print("Re-writing crawler states...")
    cs_table = meta.tables["crawler_state"]
    rp = bind.execute(sa.select([cs_table]))
    while True:
        cs = rp.fetchone()
        if cs is None:
            break
        q = sa.update(cs_table).where(cs_table.c.id == cs.id)
        q = q.values(collection_id=id_map[cs.source_id])
        bind.execute(q)

    # print 'DOING DOCS NOW'
    print("Writing document/collection associations...")
    doc_table = meta.tables["document"]
    coll_doc_table = meta.tables["collection_document"]
    rp = bind.execute(sa.select([doc_table]))
    refs = []
    while True:
        doc = rp.fetchone()
        if doc is None:
            break
        refs.append({"collection_id": id_map[doc.source_id], "document_id": doc.id})
        if len(refs) > 10000:
            op.bulk_insert(coll_doc_table, refs)
            refs = []

    if len(refs):
        op.bulk_insert(coll_doc_table, refs)


def downgrade():
    raise ValueError("No coming back from this.")
