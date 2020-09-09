import logging
from pprint import pprint  # noqa
from normality import normalize
from followthemoney import model

from aleph.core import es, cache
from aleph.model import Collection, Entity
from aleph.index.indexes import entities_read_index
from aleph.index.util import index_name, index_settings, configure_index
from aleph.index.util import query_delete, index_safe, delete_safe
from aleph.index.util import KEYWORD_COPY, KEYWORD

STATS_FACETS = [
    "schema",
    "names",
    "addresses",
    "phones",
    "emails",
    "countries",
    "languages",
    "ibans",
]
log = logging.getLogger(__name__)


def collections_index():
    """Combined index to run all queries against."""
    return index_name("collection", "v1")


def configure_collections():
    mapping = {
        "date_detection": False,
        "dynamic": False,
        "dynamic_templates": [
            {"fields": {"match": "schemata.*", "mapping": {"type": "long"}}}
        ],
        "_source": {"excludes": ["text"]},
        "properties": {
            "label": {
                "type": "text",
                "copy_to": "text",
                "analyzer": "latin_index",
                "fields": {"kw": KEYWORD},
            },
            "collection_id": KEYWORD,
            "foreign_id": KEYWORD_COPY,
            "languages": KEYWORD_COPY,
            "countries": KEYWORD_COPY,
            "category": KEYWORD_COPY,
            "frequency": KEYWORD_COPY,
            "summary": {"type": "text", "copy_to": "text", "index": False},
            "publisher": KEYWORD_COPY,
            "publisher_url": KEYWORD_COPY,
            "data_url": KEYWORD_COPY,
            "info_url": KEYWORD_COPY,
            "creator_id": KEYWORD,
            "team_id": KEYWORD,
            "text": {
                "type": "text",
                "analyzer": "latin_index",
                "term_vector": "with_positions_offsets",
                "store": True,
            },
            "casefile": {"type": "boolean"},
            "restricted": {"type": "boolean"},
            "secret": {"type": "boolean"},
            "xref": {"type": "boolean"},
            "created_at": {"type": "date"},
            "updated_at": {"type": "date"},
            "count": {"type": "long"},
            "schemata": {"dynamic": True, "type": "object"},
        },
    }
    index = collections_index()
    settings = index_settings(shards=1)
    return configure_index(index, mapping, settings)


def index_collection(collection, sync=False):
    """Index a collection."""
    if collection.deleted_at is not None:
        return delete_collection(collection.id)

    data = get_collection(collection.id)
    if data is None:
        return

    log.info(
        "[%s] Index: %s (%s things)...",
        collection,
        data.get("label"),
        data.get("count"),
    )
    text = [data.get("label")]
    text.append(normalize(data.get("label")))
    text.append(normalize(data.get("foreign_id")))
    text.append(normalize(data.get("summary")))
    data["text"] = text
    data.pop("id", None)
    return index_safe(collections_index(), collection.id, data, sync=sync)


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

    index = entities_read_index(schema=Entity.THING)
    query = {"term": {"collection_id": collection_id}}
    result = es.count(index=index, body={"query": query})
    data["count"] = result.get("count", 0)
    cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


def _facet_key(collection_id, facet):
    return cache.object_key(Collection, collection_id, facet)


def get_collection_stats(collection_id):
    """Retrieve statistics on the content of a collection."""
    keys = {_facet_key(collection_id, f): f for f in STATS_FACETS}
    empty = {"values": [], "total": 0}
    stats = {}
    for key, result in cache.get_many_complex(keys.keys(), empty):
        stats[keys[key]] = result
    return stats


def update_collection_stats(collection_id, facets=STATS_FACETS):
    """Compute some statistics on the content of a collection."""
    aggs = {}
    for facet in facets:
        # Regarding facet size, 300 would be optimal because it's
        # guaranteed to capture all schemata and countries. But it
        # adds a whole lot to the compute time, so let's see how
        # this goes.
        aggs[facet + ".values"] = {"terms": {"field": facet, "size": 100}}
        aggs[facet + ".total"] = {"cardinality": {"field": facet}}
    query = {"term": {"collection_id": collection_id}}
    query = {"size": 0, "query": query, "aggs": aggs}
    index = entities_read_index()
    result = es.search(index=index, body=query, request_timeout=3600, timeout="20m")
    results = result.get("aggregations", {})
    for facet in facets:
        buckets = results.get(facet + ".values").get("buckets", [])
        values = {b["key"]: b["doc_count"] for b in buckets}
        total = results.get(facet + ".total", {}).get("value", 0)
        data = {"values": values, "total": total}
        cache.set_complex(_facet_key(collection_id, facet), data)


def get_collection_things(collection_id):
    """Showing the number of things in a collection is more indicative
    of its size than the overall collection entity count."""
    schemata = cache.get_complex(_facet_key(collection_id, "schema"))
    if schemata is None:
        return {}
    things = {}
    for schema, count in schemata.get("values", {}).items():
        schema = model.get(schema)
        if schema is not None and schema.is_a(Entity.THING):
            things[schema.name] = count
    return things


def delete_collection(collection_id, sync=False):
    """Delete all documents from a particular collection."""
    delete_safe(collections_index(), collection_id)


def delete_entities(collection_id, origin=None, schema=None, sync=False):
    """Delete entities from a collection."""
    filters = [{"term": {"collection_id": collection_id}}]
    if origin is not None:
        filters.append({"term": {"origin": origin}})
    query = {"bool": {"filter": filters}}
    query_delete(entities_read_index(schema), query, sync=sync)
