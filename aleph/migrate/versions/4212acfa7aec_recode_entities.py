"""recode entities

Revision ID: 4212acfa7aec
Revises: 235fd19bb942
Create Date: 2016-12-01 10:24:07.638773

"""
import logging

# from pprint import pprint
from alembic import op
import sqlalchemy as sa
import uuid

log = logging.getLogger('migrate')

revision = '4212acfa7aec'
down_revision = '235fd19bb942'

SCHEMA = {
    '/entity/person.json#': 'Person',
    '/entity/organization.json#': 'Organization',
    '/entity/entity.json#': 'LegalEntity',
    '/entity/company.json#': 'Company'
}


def upgrade():
    op.alter_column('document', 'collection_id', existing_type=sa.INTEGER(), nullable=False)  # noqa
    op.add_column('entity', sa.Column('collection_id', sa.Integer, nullable=True))  # noqa
    op.create_index(op.f('ix_entity_collection_id'), 'entity', ['collection_id'], unique=False)  # noqa
    op.create_foreign_key(None, 'entity', 'collection', ['collection_id'], ['id'])  # noqa
    op.create_table('entity_identity',
        sa.Column('id', sa.Integer, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('entity_id', sa.Unicode(255), nullable=True),
        sa.Column('identity', sa.Unicode(255), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    bind = op.get_bind()
    meta = sa.MetaData()
    meta.bind = bind
    meta.reflect()
    entity_table = meta.tables['entity']
    entity_identity_table = meta.tables['entity_identity']
    document_table = meta.tables['document']
    collection_entity_table = meta.tables['collection_entity']
    reference_table = meta.tables['reference']
    permission_table = meta.tables['permission']
    alert_table = meta.tables['alert']
    q = sa.select([entity_table])
    rp = bind.execute(q)
    entities_all = rp.fetchall()
    for i, entity in enumerate(entities_all):
        log.info("Process [%s: %s]: %s", i, entity.id, entity.name)

        if entity.deleted_at is not None:
            cq = sa.delete(alert_table)
            cq = cq.where(alert_table.c.entity_id == entity.id)
            bind.execute(cq)

            cq = sa.delete(collection_entity_table)
            cq = cq.where(collection_entity_table.c.entity_id == entity.id)
            bind.execute(cq)

            cq = sa.delete(reference_table)
            cq = cq.where(reference_table.c.entity_id == entity.id)
            bind.execute(cq)

            cq = sa.delete(entity_table)
            cq = cq.where(entity_table.c.id == entity.id)
            bind.execute(cq)
            continue

        data = entity['data']
        data.pop('identifiers', None)
        data['country'] = data.pop('jurisdiction_code', None)
        data['birthDate'] = data.pop('birth_date', None)
        data['deathDate'] = data.pop('death_date', None)
        data['alias'] = []

        for on in data.pop('other_names', []):
            name = on.get('name')
            if name is None:
                continue
            data['alias'].append(name)

        for k, v in data.items():
            if v is None or v == '':
                data.pop(k)

        schema = SCHEMA.get(entity.type)

        cq = sa.select([alert_table])
        cq = cq.where(alert_table.c.entity_id == entity.id)
        alerts = bind.execute(cq).fetchall()

        cq = sa.select([reference_table, document_table.c.collection_id])
        cq = cq.select_from(reference_table.join(document_table, reference_table.c.document_id == document_table.c.id))  # noqa
        cq = cq.where(reference_table.c.entity_id == entity.id)
        references = bind.execute(cq).fetchall()

        cq = sa.select([collection_entity_table])
        cq = cq.where(collection_entity_table.c.entity_id == entity.id)
        colls = bind.execute(cq).fetchall()

        identity = uuid.uuid4().hex
        for i, coll in enumerate(colls):
            coll_id = coll.collection_id
            eid = entity.id
            if i == 0:
                q = sa.update(entity_table)
                q = q.where(entity_table.c.id == entity.id)
                q = q.values(type=schema, data=data, collection_id=coll_id)
                bind.execute(q)
            else:
                eid = uuid.uuid4().hex
                ent = {
                    'id': eid,
                    'name': entity.name,
                    'state': entity.state,
                    'type': schema,
                    'data': data,
                    'collection_id': coll_id,
                    'created_at': entity.created_at,
                    'updated_at': entity.updated_at
                }
                q = sa.insert(entity_table).values(ent)
                bind.execute(q)

            if len(colls) > 1:
                q = sa.insert(entity_identity_table).values({
                    'created_at': entity.updated_at,
                    'updated_at': entity.updated_at,
                    'entity_id': eid,
                    'identity': identity
                })
                bind.execute(q)

            for alert in alerts:
                cq = sa.select([permission_table])
                cq = cq.where(permission_table.c.collection_id == coll_id)
                cq = cq.where(permission_table.c.role_id == alert.role_id)
                cq = cq.where(permission_table.c.read == True)  # noqa
                perm = bind.execute(cq).fetchone()
                if perm is None and eid == entity.id:
                    q = sa.delete(alert_table)
                    q = q.where(alert_table.c.id == alert.id)
                    bind.execute(q)
                if perm is not None and eid != entity.id:
                    ad = dict(alert)
                    ad.pop('id', None)
                    ad['entity_id'] = eid
                    q = sa.insert(alert_table).values(ad)
                    bind.execute(q)

            for ref in references:
                refdata = dict(ref)
                collection_id = refdata.pop('collection_id')
                if entity.state == 'pending' and coll_id == collection_id:
                    q = sa.update(reference_table)
                    q = q.where(reference_table.c.id == ref.id)
                    q = q.values(entity_id=eid)
                    bind.execute(q)
                if entity.state == 'active' and eid != ref.entity_id:
                    refdata.pop('id', None)
                    refdata['entity_id'] = eid
                    q = sa.insert(reference_table).values(refdata)
                    bind.execute(q)

    op.drop_table('collection_document')
    op.drop_table('collection_entity')
    # op.alter_column('entity', 'collection_id', nullable=False)  # noqa


def downgrade():
    pass
