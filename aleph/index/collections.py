from pprint import pprint  # noqa
from elasticsearch.exceptions import NotFoundError

from aleph.core import es, es_index
from aleph.model import Document
from aleph.index.util import query_delete
from aleph.index.mapping import TYPE_LINK, TYPE_DOCUMENT, TYPE_ENTITY
from aleph.index.mapping import TYPE_COLLECTION

CHILD_TYPES = [TYPE_LINK, TYPE_DOCUMENT, TYPE_ENTITY]


def get_collection_stats(data):
    """Compute some statistics on the content of a collection."""
    query = {
        'size': 0,
        'query': {
            'term': {
                'collection_id': data.get('id')
            }
        },
        'aggs': {
            'schema': {'terms': {'field': 'schema', 'size': 1000}},
            'countries': {'terms': {'field': 'countries', 'size': 250}},
            'languages': {'terms': {'field': 'languages', 'size': 100}},
        }
    }
    result = es.search(index=es_index,
                       doc_type=[TYPE_DOCUMENT, TYPE_ENTITY],
                       body=query)
    aggregations = result.get('aggregations')
    data['$schemata'] = {}
    data['$entities'] = 0
    data['$total'] = result.get('hits').get('total')

    # expose both entities by schema count and totals for docs and entities.
    for schema in aggregations.get('schema').get('buckets'):
        key = schema.get('key')
        count = schema.get('doc_count')
        data['$schemata'][key] = count
        if key == Document.SCHEMA:
            data['$documents'] = count
        else:
            data['$entities'] += count

    # if no countries or langs are given, take the most common from the data.
    if not data.get('countries') or not len(data.get('countries')):
        countries = aggregations.get('countries').get('buckets')
        data['countries'] = [c.get('key') for c in countries]

    if not data.get('languages') or not len(data.get('languages')):
        countries = aggregations.get('languages').get('buckets')
        data['languages'] = [c.get('key') for c in countries]

    # pprint(data)
    return data


def index_collection(collection):
    """Index a collection."""
    data = collection.to_index_dict()
    data = get_collection_stats(data)
    data.pop('id', None)
    es.index(index=es_index,
             doc_type=TYPE_COLLECTION,
             id=collection.id,
             body=data)


def update_roles(collection):
    """Update the role visibility of objects which are part of collections."""
    roles = ', '.join([str(r) for r in collection.roles])
    body = {
        'query': {'term': {'collection_id': collection.id}},
        'script': {
            'inline': 'ctx._source.roles = [%s]' % roles
        }
    }
    es.update_by_query(index=es_index,
                       doc_type=CHILD_TYPES,
                       body=body,
                       wait_for_completion=False)


def delete_collection(collection_id):
    """Delete all documents from a particular collection."""
    query_delete({'term': {'collection_id': collection_id}})
    query_delete({'term': {'entity_collection_id': collection_id}})
    try:
        es.delete(index=es_index, doc_type=TYPE_COLLECTION, id=collection_id)
    except NotFoundError:
        pass
