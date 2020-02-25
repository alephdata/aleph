import logging
from pprint import pprint  # noqa
from normality import normalize

from aleph.core import es, cache
from aleph.model import Entity, Collection
from aleph.index.indexes import collections_index, entities_read_index
from aleph.index.util import query_delete, index_safe, refresh_sync

STATS_FACETS = ['schema', 'names', 'addresses', 'phones', 'emails',
                'countries', 'languages', 'ibans']
log = logging.getLogger(__name__)


def index_collection(collection, sync=False):
    """Index a collection."""
    if collection.deleted_at is not None:
        return delete_collection(collection.id)

    log.info("Index [%s]: %s", collection.id, collection.label)
    data = get_collection(collection.id)
    if data is None:
        return
    text = [data.get('label')]
    text.append(normalize(data.get('label')))
    text.append(normalize(data.get('foreign_id')))
    text.append(normalize(data.get('summary')))
    data['text'] = text
    data.pop('id', None)
    return index_safe(collections_index(),
                      collection.id, data,
                      refresh=refresh_sync(sync))


def get_collection(collection_id):
    """Fetch a collection from the index."""
    if collection_id is None:
        return
    key = cache.object_key(Collection, collection_id)
    data = cache.get_complex(key)
    if data is not None:
        return data

    collection = Collection.by_id(collection_id)
    if collection is None:
        return

    data = collection.to_dict()
    schemata = get_facet_values(collection.id, 'schema')
    schemata = schemata.get('values', {})
    data['count'] = sum(schemata.values())
    data['schemata'] = schemata
    cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


def get_collection_stats(collection_id, refresh=False):
    """Retrieve statistics on the content of a collection."""
    return {f: get_facet_values(collection_id, f) for f in STATS_FACETS}


def update_collection_stats(collection_id):
    for facet in STATS_FACETS:
        get_facet_values(collection_id, facet, refresh=True)


def get_facet_values(collection_id, facet, refresh=False):
    """Compute some statistics on the content of a collection."""
    key = cache.object_key(Collection, collection_id, facet)
    data = cache.get_complex(key)
    if not refresh and data is not None:
        return data

    query = {'term': {'collection_id': collection_id}}
    query = {
        'size': 0,
        'query': {'bool': {'filter': [query]}},
        'aggs': {
            'values': {'terms': {'field': facet, 'size': 300}},
            'total': {'cardinality': {'field': facet}}
        }
    }
    index = entities_read_index(schema=Entity.THING)
    result = es.search(index=index,
                       body=query,
                       request_timeout=3600,
                       timeout='20m')
    aggregations = result.get('aggregations')
    values = {}
    for bucket in aggregations.get('values').get('buckets', []):
        values[bucket['key']] = bucket['doc_count']
    data = {
        'values': values,
        'total': aggregations.get('total').get('value', 0)
    }
    cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


def delete_collection(collection_id, sync=False):
    """Delete all documents from a particular collection."""
    es.delete(collections_index(),
              id=str(collection_id),
              refresh=refresh_sync(sync),
              ignore=[404])


def delete_entities(collection_id, mapping_id=None, schema=None, sync=False):
    """Delete entities from a collection."""
    filters = [{'term': {'collection_id': collection_id}}]
    if mapping_id is not None:
        filters.append({'term': {'mapping_id': mapping_id}})
    query = {'bool': {'filter': filters}}
    query_delete(entities_read_index(schema), query, sync=sync)
