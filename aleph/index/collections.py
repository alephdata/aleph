import logging
from pprint import pprint  # noqa
from banal import ensure_list
from followthemoney.types import registry

from aleph.core import es, cache
from aleph.model import Entity, Collection
from aleph.index.indexes import collections_index, entities_read_index
from aleph.index.util import query_delete, index_safe, refresh_sync

log = logging.getLogger(__name__)


def index_collection(collection, sync=False):
    """Index a collection."""
    if collection.deleted_at is not None:
        return delete_collection(collection.id)

    data = get_collection(collection.id)
    data.pop('id', None)
    return index_safe(collections_index(), collection.id, data,
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
    stats = get_collection_stats(collection.id)
    data['count'] = stats['count']
    data['schemata'] = stats['schemata']

    # if no countries or langs are given, take the most common from the data.
    countries = ensure_list(collection.countries)
    countries = countries or stats['countries'].keys()
    data['countries'] = registry.country.normalize_set(countries)

    languages = ensure_list(collection.languages)
    languages = languages or stats['languages'].keys()
    data['languages'] = registry.language.normalize_set(languages)
    cache.set_complex(key, data, expire=cache.EXPIRE)
    return data


def get_collection_stats(collection_id):
    """Compute some statistics on the content of a collection."""
    log.info("Generating collection stats: %s", collection_id)
    query = {'term': {'collection_id': collection_id}}
    query = {
        'size': 0,
        'query': {'bool': {'filter': [query]}},
        'aggs': {
            'schemata': {'terms': {'field': 'schema', 'size': 1000}},
            'countries': {'terms': {'field': 'countries', 'size': 1000}},
            'languages': {'terms': {'field': 'languages', 'size': 1000}},
        }
    }
    index = entities_read_index(schema=Entity.THING)
    result = es.search(index=index, body=query)
    aggregations = result.get('aggregations', {})
    data = {'count': 0}
    for facet in ['schemata', 'countries', 'languages']:
        data[facet] = {}
        for bucket in aggregations.get(facet, {}).get('buckets', []):
            data[facet][bucket['key']] = bucket['doc_count']
    if len(data['schemata']):
        data['count'] = sum(data['schemata'].values())
    return data


def delete_collection(collection_id, sync=False):
    """Delete all documents from a particular collection."""
    es.delete(collections_index(),
              id=str(collection_id),
              refresh=refresh_sync(sync),
              ignore=[404])


def delete_entities(collection_id, schema=None, bulk_only=False):
    """Delete entities from a collection."""
    filters = [{'term': {'collection_id': collection_id}}]
    if bulk_only:
        filters.append({'term': {'bulk': True}})
    if schema is not None:
        filters.append({'term': {'schemata': schema.name}})
    query = {'bool': {'filter': filters}}
    query_delete(entities_read_index(schema), query)
