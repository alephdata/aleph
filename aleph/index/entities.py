from __future__ import absolute_import

import logging

from aleph.core import es, es_index
from aleph.datasets.util import finalize_index
from aleph.index.mapping import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.index.util import query_delete

log = logging.getLogger(__name__)


def delete_entity(entity_id):
    """Delete an entity from the index."""
    es.delete(index=es_index, doc_type=TYPE_ENTITY, id=entity_id, ignore=[404])


def delete_collection_entities():
    q = {'exists': {'field': 'collection_id'}}
    query_delete(q, doc_type=TYPE_ENTITY)


def get_count(entity):
    """Inaccurate, as it does not reflect auth."""
    q = {'term': {'entities.id': entity.id}}
    q = {'size': 0, 'query': q}
    result = es.search(index=es_index, doc_type=TYPE_DOCUMENT, body=q)
    return result.get('hits', {}).get('total', 0)


def index_entity(entity):
    """Index an entity."""
    data = entity.to_index_dict()
    data.pop('id', None)
    data['doc_count'] = get_count(entity)
    data = finalize_index(data, entity.schema)
    es.index(index=es_index, doc_type=TYPE_ENTITY, id=entity.id, body=data)
