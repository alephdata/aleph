from __future__ import absolute_import

import logging
from elasticsearch.helpers import scan

from aleph.core import es, es_index, db
from aleph.model import Entity, Reference
from aleph.datasets.util import finalize_index
from aleph.index.mapping import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.index.admin import flush_index
from aleph.index.util import bulk_op, query_delete

log = logging.getLogger(__name__)


def delete_entity(entity_id):
    """Delete an entity from the index."""
    es.delete(index=es_index, doc_type=TYPE_ENTITY, id=entity_id, ignore=[404])


def document_updates(q, entity_id, collection_id=None):
    for res in scan(es, query=q, index=str(es_index), doc_type=TYPE_DOCUMENT):
        body = res.get('_source')
        entities = []
        if collection_id is not None:
            entities.append({
                'id': entity_id,
                'collection_id': collection_id
            })
        for ent in body.get('entities'):
            if ent['id'] != entity_id:
                entities.append(ent)
        body['entities'] = entities
        yield {
            '_op_type': 'update',
            '_id': res['_id'],
            '_type': res['_type'],
            '_index': res['_index'],
            '_retry_on_conflict': 5,
            'doc': body
        }


def delete_entity_references(entity_id):
    """Delete all entities associated with any collection.

    This is used by the ``indexentities`` management command in order to clear
    out any leftover entities in the index.
    """
    q = {'query': {'term': {'entities.id': entity_id}}}
    bulk_op(document_updates(q, entity_id))
    flush_index()


def delete_collection_entities():
    q = {'exists': {'field': 'collection_id'}}
    query_delete(q, doc_type=TYPE_ENTITY)


def update_entity_references(entity, max_query=1000):
    """Same as above but runs in bulk for a particular entity."""
    q = db.session.query(Reference.document_id)
    q = q.filter(Reference.entity_id == entity.id)
    q = q.filter(Entity.id == Reference.entity_id)
    q = q.filter(Entity.state == Entity.STATE_ACTIVE)
    documents = [str(r.document_id) for r in q]

    for i in range(0, len(documents), max_query):
        q = {'query': {'ids': {'values': documents[i:i + max_query]}}}
        bulk_op(document_updates(q, entity.id, entity.collection_id))

    flush_index()


def get_count(entity):
    """Inaccurate, as it does not reflect auth."""
    q = {'term': {'entities.id': entity.id}}
    q = {'size': 0, 'query': q}
    result = es.search(index=es_index, doc_type=TYPE_DOCUMENT, body=q)
    return result.get('hits', {}).get('total', 0)


def index_entity(entity):
    """Index an entity."""
    data = entity.to_index()
    data.pop('id', None)
    data['doc_count'] = get_count(entity)
    data = finalize_index(data, entity.schema)
    es.index(index=es_index, doc_type=TYPE_ENTITY, id=entity.id, body=data)
