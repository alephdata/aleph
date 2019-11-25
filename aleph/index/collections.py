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
    # query = {'term': {'collection_id': collection_id}}
    # query = {'query': {'bool': {'filter': [query]}}}
    # index = entities_read_index(schema=Entity.THING)
    # result = es.count(index=index, body=query)
    # data['count'] = result.get('count', 0)
    statistics = get_collection_statistics(collection.id)
    schemata = statistics.get('schema', {})
    data['count'] = sum(schemata.values())
    data['schemata'] = schemata

    # countries = ensure_list(collection.countries)
    # data['countries'] = registry.country.normalize_set(countries)
    # languages = ensure_list(collection.languages)
    # data['languages'] = registry.language.normalize_set(languages)
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
    aggs = {f: {'terms': {'field': f, 'size': 300}} for f in facets}
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
        data[facet] = {}
        for bucket in aggregations.get(facet, {}).get('buckets', []):
            data[facet][bucket['key']] = bucket['doc_count']
    cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


def delete_collection(collection_id, sync=False):
    """Delete all documents from a particular collection."""
    es.delete(collections_index(),
              id=str(collection_id),
              refresh=refresh_sync(sync),
              ignore=[404])


def delete_entities(collection_id, schema=None, sync=False):
    """Delete entities from a collection."""
    filters = [{'term': {'collection_id': collection_id}}]
    query = {'bool': {'filter': filters}}
    query_delete(entities_read_index(schema), query, sync=sync)
