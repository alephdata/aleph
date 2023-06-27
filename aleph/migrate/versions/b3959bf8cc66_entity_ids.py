"""Migrate entity IDs and simplify schema.

Revision ID: b3959bf8cc66
Revises: 1519391870a0
Create Date: 2020-02-07 07:10:40.437321

"""
from alembic import op
import sqlalchemy as sa
from followthemoney import model
from followthemoney.namespace import Namespace

# revision identifiers, used by Alembic.
revision = "b3959bf8cc66"
down_revision = "1519391870a0"


def upgrade():
    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect(bind=bind)
    entity_table = meta.tables["entity"]
    collection_table = meta.tables["collection"]
    q = sa.select(collection_table)
    crp = bind.execute(q)
    for collection in crp.fetchall():
        ns = Namespace(collection.foreign_id)
        q = sa.select(entity_table)
        q = q.where(entity_table.c.collection_id == collection.id)
        erp = bind.execute(q)
        while True:
            entity = erp.fetchone()
            if not entity:
                break
            proxy = model.get_proxy(
                {"id": entity.id, "schema": entity.schema, "properties": entity.data},
                cleaned=False,
            )
            proxy.add("name", entity.name, quiet=True, cleaned=False)
            proxy = ns.apply(proxy)
            q = sa.update(entity_table)
            q = q.where(entity_table.c.id == entity.id)
            q = q.values(id=proxy.id, data=proxy.properties)
            bind.execute(q)

    op.drop_column("entity", "foreign_id")
    op.drop_column("entity", "name")


def downgrade():
    pass
