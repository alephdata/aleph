import logging
from pprint import pprint  # noqa
from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry

from aleph.core import es, cache
from aleph.model import Entity, Collection
from aleph.index.indexes import collections_index, entities_read_index
from aleph.index.util import query_delete, unpack_result, index_safe
from aleph.index.util import refresh_sync, MAX_PAGE

log = logging.getLogger(__name__)


def index_collection(collection, sync=False):
    """Index a collection."""
    if collection.deleted_at is not None:
        return delete_collection(collection.id)

    data = collection.to_dict()
    data.pop('id', None)
    stats = get_collection_stats(collection.id)
    data['count'] = stats['count']

    # expose entities by schema count.
    data['schemata'] = {}
    for schema, count in stats['schemata'].items():
        schema = model.get(schema)
        if schema is not None:
            data['schemata'][schema.name] = count

    # if no countries or langs are given, take the most common from the data.
    countries = ensure_list(collection.countries)
    countries = countries or stats['countries'].keys()
    data['countries'] = registry.country.normalize_set(countries)

    languages = ensure_list(collection.languages)
    languages = languages or stats['languages'].keys()
    data['languages'] = registry.language.normalize_set(languages)
    return index_safe(collections_index(), collection.id, data,
                      refresh=refresh_sync(sync))


def get_collection(collection_id):
    """Fetch a collection from the index."""
    if collection_id is None:
        return
    key = cache.object_key(Collection, collection_id)
    data = cache.get_complex(key)
    if data is None:
        log.debug("Collection [%s]: regenerating cache", collection_id)
        result = es.get(index=collections_index(),
                        doc_type='doc',
                        id=collection_id,
                        ignore=[404],
                        _source_exclude=['text'])
        data = unpack_result(result)
        cache.set_complex(key, data, expire=cache.EXPIRE)
    return data


def get_collection_stats(collection_id):
    """Compute some statistics on the content of a collection."""
    key = cache.object_key(Collection, collection_id, 'stats')
    data = cache.get_complex(key)
    if data is not None:
        return data

    log.info("Generating collection stats: %s", collection_id)
    query = {
        'size': 0,
        'query': {
            'bool': {
                'filter': [
                    {'term': {'collection_id': collection_id}}
                ]
            }
        },
        'aggs': {
            'schemata': {'terms': {'field': 'schema', 'size': 1000}},
            'countries': {'terms': {'field': 'countries', 'size': 500}},
            'languages': {'terms': {'field': 'languages', 'size': 10}},
        }
    }
    index = entities_read_index(schema=Entity.THING)
    result = es.search(index=index, body=query)
    aggregations = result.get('aggregations', {})
    data = {'count': result.get('hits', {}).get('total', 0)}

    for facet in ['schemata', 'countries', 'languages']:
        data[facet] = {}
        for bucket in aggregations.get(facet, {}).get('buckets', []):
            data[facet][bucket['key']] = bucket['doc_count']
    cache.set_complex(key, data, expire=cache.EXPIRE)
    return data


def get_sitemap_entities(collection_id):
    filters = [
        {'term': {'collection_id': collection_id}},
        {'term': {'schemata': Entity.THING}},
    ]
    query = {
        'query': {
            'bool': {
                'filter': filters
            }
        },
        'size': MAX_PAGE,
        'sort': [{'updated_at': 'desc'}],
        '_source': {'includes': ['schema', 'updated_at']}
    }
    index = entities_read_index(Entity.THING)
    res = es.search(index=index, body=query)
    for res in res.get('hits', {}).get('hits', []):
        source = res.get('_source')
        source['id'] = res.get('_id')
        yield source


def delete_collection(collection_id, sync=False):
    """Delete all documents from a particular collection."""
    es.delete(collections_index(),
              doc_type='doc',
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
