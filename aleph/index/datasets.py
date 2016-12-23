import logging
from pprint import pprint  # noqa
from elasticsearch.helpers import bulk, scan

from aleph.core import es, es_index, schemata
from aleph.index.mapping import TYPE_ENTITY, TYPE_LINK
from aleph.index.util import merge_docs

log = logging.getLogger(__name__)
INDEX_PAGE = 10000


def _index_updates(items):
    """Look up existing index documents and generate an updated form.

    This is necessary to make the index accumulative, i.e. if an entity or link
    gets indexed twice with different field values, it'll add up the different
    field values into a single record. This is to avoid overwriting the
    document and losing field values. An alternative solution would be to
    implement this in Groovy on the ES.
    """
    queries, links, entities = [], [], {}
    for (doc_type, doc_id, source) in items:
        if doc_type == TYPE_LINK:
            links.append((doc_id, source))
        elif doc_type == TYPE_ENTITY:
            queries.append({
                '_id': doc_id,
                '_type': doc_type
            })
            entities[doc_id] = source

    result = es.mget(index=es_index, body={'docs': queries})
    for idx_doc in result.get('docs'):
        if not idx_doc.get('found', False):
            continue
        entity_id = idx_doc['_id']
        entity = entities.get(entity_id)
        existing = idx_doc.get('_source')
        combined = merge_docs(entity, existing)
        combined['schema'] = schemata.merge_entity_schema(entity['schema'],
                                                          existing['schema'])
        entities[entity_id] = combined

    for doc_id, link in links:
        link.pop('id', None)
        entity = dict(entities.get(link.pop('remote')))
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
        # pprint(entity)
        entity.pop('id', None)
        yield {
            '_id': doc_id,
            '_type': TYPE_ENTITY,
            '_index': str(es_index),
            '_source': entity
        }


def index_items(items):
    """Index a set of links or entities."""
    bulk(es, _index_updates(items), stats_only=True, request_timeout=200.0)


def delete_dataset(dataset_name):
    """Delete all entries from a particular dataset."""
    q = {'query': {'term': {'dataset': dataset_name}}, '_source': False}

    def deletes():
        docs = scan(es, query=q, index=es_index,
                    doc_type=[TYPE_LINK, TYPE_ENTITY])
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
    bulk(es, deletes(), stats_only=True, request_timeout=200.0)
