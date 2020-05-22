import logging
from pprint import pprint  # noqa
from normality import normalize
from followthemoney import model
from followthemoney.types import registry

from aleph.core import es, cache, settings
from aleph.model import Collection, Entity
from aleph.index.indexes import entities_read_index
from aleph.index.util import index_name, index_settings, configure_index
from aleph.index.util import query_delete, index_safe, refresh_sync
from aleph.index.util import KEYWORD_COPY, KEYWORD

STATS_FACETS = ['schema', 'names', 'addresses', 'phones', 'emails',
                'countries', 'languages', 'ibans']
log = logging.getLogger(__name__)


def collections_index():
    """Combined index to run all queries against."""
    return index_name('collection', settings.INDEX_WRITE)


def configure_collections():
    mapping = {
        "date_detection": False,
        "dynamic": False,
        "dynamic_templates": [
            {
                "fields": {
                    "match": "schemata.*",
                    "mapping": {"type": "long"}
                }
            }
        ],
        "_source": {"excludes": ["text"]},
        "properties": {
            "label": {
                "type": "text",
                "copy_to": "text",
                "analyzer": "latin_index",
                "fields": {"kw": KEYWORD}
            },
            "collection_id": KEYWORD,
            "foreign_id": KEYWORD_COPY,
            "languages": KEYWORD_COPY,
            "countries": KEYWORD_COPY,
            "category": KEYWORD_COPY,
            "summary": {
                "type": "text",
                "copy_to": "text",
                "index": False
            },
            "publisher": KEYWORD_COPY,
            "publisher_url": KEYWORD_COPY,
            "data_url": KEYWORD_COPY,
            "info_url": KEYWORD_COPY,
            "kind": KEYWORD,
            "creator_id": KEYWORD,
            "team_id": KEYWORD,
            "text": {
                "type": "text",
                "analyzer": "latin_index",
                "term_vector": "with_positions_offsets",
                "store": True
            },
            "casefile": {"type": "boolean"},
            "secret": {"type": "boolean"},
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"},
            "count": {"type": "long"},
            "schemata": {
                "dynamic": True,
                "type": "object"
            }
        }
    }
    index = collections_index()
    settings = index_settings(shards=1)
    return configure_index(index, mapping, settings)


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
    things = get_collection_things(collection.id)
    data['count'] = sum(things.values())
    cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


def get_collection_stats(collection_id, refresh=False):
    """Retrieve statistics on the content of a collection."""
    return {f: get_collection_facet(collection_id, f) for f in STATS_FACETS}


def update_collection_stats(collection_id):
    for facet in STATS_FACETS:
        get_collection_facet(collection_id, facet, refresh=True)


def get_collection_facet(collection_id, facet, refresh=False):
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
    schemata = set()
    facet_type = registry.groups.get(facet)
    if facet_type is not None:
        schemata = model.get_type_schemata(facet_type)
    result = es.search(index=entities_read_index(schema=schemata),
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


def get_collection_things(collection_id):
    """Showing the number of things in a collection is more indicative
    of its size than the overall collection entity count."""
    schemata = get_collection_facet(collection_id, 'schema')
    things = {}
    for schema, count in schemata.get('values', {}).items():
        schema = model.get(schema)
        if schema is not None and schema.is_a(Entity.THING):
            things[schema.name] = count
    return things


def delete_collection(collection_id, sync=False):
    """Delete all documents from a particular collection."""
    es.delete(collections_index(),
              id=str(collection_id),
              refresh=refresh_sync(sync),
              ignore=[404])


def delete_entities(collection_id, origin=None, schema=None, sync=False):
    """Delete entities from a collection."""
    filters = [{'term': {'collection_id': collection_id}}]
    if origin is not None:
        filters.append({'term': {'origin': origin}})
    query = {'bool': {'filter': filters}}
    query_delete(entities_read_index(schema), query, sync=sync)
