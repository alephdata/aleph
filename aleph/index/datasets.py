import logging
import time
from pprint import pprint  # noqa
from elasticsearch.helpers import bulk, scan, BulkIndexError

from aleph.core import es, es_index, schemata
from aleph.index.mapping import TYPE_ENTITY, TYPE_LINK, TYPE_LEAD
from aleph.index.util import merge_docs, bulk_op

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

    queries = [{'_id': e, '_type': TYPE_ENTITY} for e in entities.keys()]
    result = es.mget(index=es_index, body={'docs': queries})
    for idx_doc in result.get('docs', []):
        if not idx_doc.get('found', False):
            continue
        entity_id = idx_doc['_id']
        entity = entities.get(entity_id)
        existing = idx_doc.get('_source')
        combined = merge_docs(entity, existing)
        combined['schema'] = schemata.merge_entity_schema(entity['schema'], existing['schema'])  # noqa
        combined['roles'] = entity.get('roles', [])
        entities[entity_id] = combined

    for link in links:
        doc = dict(link)
        doc_id = doc.pop('id', None)
        if doc_id is None:
            continue
        entity = entities.get(doc.get('remote'))
        if entity is None:
            continue
        entity = dict(entity)
        doc['text'].extend(entity.pop('text', []))
        doc['text'] = list(set(doc['text']))
        doc['remote'] = entity
        yield {
            '_id': doc_id,
            '_type': TYPE_LINK,
            '_index': str(es_index),
            '_source': doc
        }

    for doc_id, entity in entities.items():
        entity.pop('id', None)
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
        except BulkIndexError as exc:
            log.warning('Indexing error: %s', exc)
            time.sleep(10)


def delete_dataset(dataset_name):
    """Delete all entries from a particular dataset."""
    q = {'query': {'term': {'dataset': dataset_name}}, '_source': False}

    def deletes():
        docs = scan(es, query=q, index=es_index,
                    doc_type=[TYPE_LINK, TYPE_ENTITY, TYPE_LEAD])
        for i, res in enumerate(docs):
            yield {
                '_op_type': 'delete',
                '_index': str(es_index),
                '_type': res.get('_type'),
                '_id': res.get('_id')
            }
            if i > 0 and i % 10000 == 0:
                log.info("Delete %s: %s", dataset_name, i)

    es.indices.refresh(index=es_index)
    bulk_op(deletes())
