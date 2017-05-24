import logging
import time
from pprint import pprint  # noqa
from elasticsearch.helpers import BulkIndexError
from elasticsearch import TransportError

from aleph.core import es, es_index, schemata
from aleph.index.mapping import TYPE_ENTITY, TYPE_LINK, TYPE_LEAD
from aleph.index.util import merge_docs, bulk_op, query_delete

log = logging.getLogger(__name__)


def _index_updates(entities, links):
    """Look up existing index documents and generate an updated form.

    This is necessary to make the index accumulative, i.e. if an entity or link
    gets indexed twice with different field values, it'll add up the different
    field values into a single record. This is to avoid overwriting the
    document and losing field values. An alternative solution would be to
    implement this in Groovy on the ES.
    """
    if not len(entities):
        return

    result = es.mget(index=es_index, doc_type=TYPE_ENTITY,
                     body={'ids': entities.keys()})
    for doc in result.get('docs', []):
        if not doc.get('found', False):
            continue
        entity_id = doc['_id']
        entity = entities.get(entity_id)
        existing = doc.get('_source')
        combined = merge_docs(entity, existing)
        combined['schema'] = schemata.merge_entity_schema(entity['schema'],
                                                          existing['schema'])
        combined['roles'] = entity.get('roles', [])
        entities[entity_id] = combined

    for link in links:
        doc_id = link.pop('id', None)
        if doc_id is None:
            continue
        entity = entities.get(link.pop('remote'))
        if entity is None:
            continue
        entity = dict(entity)
        link['text'].extend(entity.pop('text', []))
        link['text'] = list(set(link['text']))
        link['remote'] = entity
        yield {
            '_id': doc_id,
            '_type': TYPE_LINK,
            '_index': str(es_index),
            '_source': link
        }

    for doc_id, entity in entities.items():
        entity.pop('id', None)
        # from pprint import pprint
        # pprint(entity)
        yield {
            '_id': doc_id,
            '_type': TYPE_ENTITY,
            '_index': str(es_index),
            '_source': entity
        }


def index_items(entities, links):
    """Index a set of links or entities."""
    while True:
        try:
            bulk_op(_index_updates(entities, links))
            break
        except (BulkIndexError, TransportError) as exc:
            log.warning('Indexing error: %s', exc)
            time.sleep(10)


def delete_dataset(dataset_name):
    """Delete all entries from a particular dataset."""
    q = {'term': {'dataset': dataset_name}}
    query_delete(q, doc_type=[TYPE_LINK, TYPE_ENTITY, TYPE_LEAD])
