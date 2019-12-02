import logging
from pprint import pprint  # noqa
from normality import normalize

from aleph.core import es, cache
from aleph.model import Entity, Collection
from aleph.index.indexes import collections_index, entities_read_index
from aleph.index.util import query_delete, index_safe, refresh_sync

log = logging.getLogger(__name__)


def index_collection(collection, sync=False):
    """Index a collection."""
    if collection.deleted_at is not None:
        return delete_collection(collection.id)

    log.info("Index [%s]: %s", collection.id, collection.label)
    data = get_collection(collection.id)
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
    statistics = get_collection_statistics(collection.id)
    schemata = statistics.get('schema', {}).get('values', {})
    data['count'] = sum(schemata.values())
    data['schemata'] = schemata

    cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


def get_collection_statistics(collection_id):
    """Compute some statistics on the content of a collection."""
    if collection_id is None:
        return
    key = cache.object_key(Collection, collection_id, 'stats')
    data = cache.get_complex(key)
    if data is not None:
        return data

    facets = ['schema', 'names', 'addresses', 'phones', 'emails',
              'countries', 'languages', 'ibans']

    log.info("Generating statistics: %s", collection_id)
    aggs = {}
    for facet in facets:
        aggs[facet] = {'terms': {'field': facet, 'size': 300}}
        aggs['%s.card' % facet] = {'cardinality': {'field': facet}}
    query = {'term': {'collection_id': collection_id}}
    query = {
        'size': 0,
        'query': {'bool': {'filter': [query]}},
        'aggs': aggs
    }
    index = entities_read_index(schema=Entity.THING)
    result = es.search(index=index, body=query)
    aggregations = result.get('aggregations', {})
    data = {}
    for facet in facets:
        values = {}
        for bucket in aggregations.get(facet, {}).get('buckets', []):
            values[bucket['key']] = bucket['doc_count']
        totals = aggregations.get('%s.card' % facet, {})
        data[facet] = {
            'values': values,
            'total': totals.get('value', 0)
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
