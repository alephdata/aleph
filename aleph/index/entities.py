import logging
import itertools
import fingerprints
from pprint import pprint, pformat  # noqa
from banal import ensure_list, first
from followthemoney import model
from followthemoney.proxy import EntityProxy
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import es, cache
from aleph.model import Entity
from aleph.index.indexes import entities_write_index, entities_read_index
from aleph.index.util import unpack_result, delete_safe
from aleph.index.util import authz_query, bulk_actions
from aleph.index.util import MAX_PAGE, NUMERIC_TYPES
from aleph.index.util import MAX_REQUEST_TIMEOUT, MAX_TIMEOUT


log = logging.getLogger(__name__)
PROXY_INCLUDES = [
    "schema",
    "properties",
    "collection_id",
    "profile_id",
    "role_id",
    "mutable",
    "created_at",
    "updated_at",
]
ENTITY_SOURCE = {"includes": PROXY_INCLUDES}


def _source_spec(includes, excludes):
    includes = ensure_list(includes)
    excludes = ensure_list(excludes)
    return {"includes": includes, "excludes": excludes}


def _entities_query(filters, authz, collection_id, schemata):
    filters = filters or []
    if authz is not None:
        filters.append(authz_query(authz))
    if collection_id is not None:
        filters.append({"term": {"collection_id": collection_id}})
    # if ensure_list(schemata):
    #     filters.append({"terms": {"schemata": ensure_list(schemata)}})
    return {"bool": {"filter": filters}}


def get_field_type(field):
    field = field.split(".")[-1]
    if field in registry.groups:
        return registry.groups[field]
    for prop in model.properties:
        if prop.name == field:
            return prop.type
    return registry.string


def iter_entities(
    authz=None,
    collection_id=None,
    schemata=None,
    includes=PROXY_INCLUDES,
    excludes=None,
    filters=None,
    sort=None,
    es_scroll="5m",
    es_scroll_size=1000,
):
    """Scan all entities matching the given criteria."""
    query = {
        "query": _entities_query(filters, authz, collection_id, schemata),
        "_source": _source_spec(includes, excludes),
    }
    preserve_order = False
    if sort is not None:
        query["sort"] = ensure_list(sort)
        preserve_order = True
    index = entities_read_index(schema=schemata)
    for res in scan(
        es,
        index=index,
        query=query,
        timeout=MAX_TIMEOUT,
        request_timeout=MAX_REQUEST_TIMEOUT,
        preserve_order=preserve_order,
        scroll=es_scroll,
        size=es_scroll_size,
    ):
        entity = unpack_result(res)
        if entity is not None:
            yield entity


def iter_proxies(**kw):
    for data in iter_entities(**kw):
        schema = model.get(data.get("schema"))
        if schema is None:
            continue
        yield model.get_proxy(data)


def iter_adjacent(collection_id, entity_id):
    """Used for recursively deleting entities and their linked associations."""
    yield from iter_entities(
        includes=["collection_id"],
        collection_id=collection_id,
        filters=[{"term": {"entities": entity_id}}],
    )


def entities_by_ids(
    ids, schemata=None, cached=False, includes=PROXY_INCLUDES, excludes=None
):
    """Iterate over unpacked entities based on a search for the given
    entity IDs."""
    ids = ensure_list(ids)
    if not len(ids):
        return
    cached = cached and excludes is None and includes == PROXY_INCLUDES
    entities = {}
    if cached:
        keys = [cache.object_key(Entity, i) for i in ids]
        for _, entity in cache.get_many_complex(keys):
            if entity is not None:
                entities[entity.get("id")] = entity

    missing = [i for i in ids if entities.get(id) is None]
    index = entities_read_index(schema=schemata)

    query = {
        "query": {"ids": {"values": missing}},
        "_source": _source_spec(includes, excludes),
        "size": MAX_PAGE,
    }
    result = es.search(index=index, body=query)
    for doc in result.get("hits", {}).get("hits", []):
        entity = unpack_result(doc)
        if entity is not None:
            entity_id = entity.get("id")
            entities[entity_id] = entity
            if cached:
                key = cache.object_key(Entity, entity_id)
                cache.set_complex(key, entity, expires=60 * 60 * 2)

    for i in ids:
        entity = entities.get(i)
        if entity is not None:
            yield entity


def get_entity(entity_id, **kwargs):
    """Fetch an entity from the index."""
    for entity in entities_by_ids(entity_id, cached=True, **kwargs):
        return entity


def index_entity(entity, sync=False):
    """Index an entity."""
    return index_proxy(entity.collection, entity.to_proxy(), sync=sync)


def index_proxy(collection, proxy, sync=False):
    delete_entity(proxy.id, exclude=proxy.schema, sync=False)
    return index_bulk(collection, [proxy], sync=sync)


def index_bulk(collection, entities, sync=False):
    """Index a set of entities."""
    entities = (format_proxy(p, collection) for p in entities)
    entities = (e for e in entities if e is not None)
    bulk_actions(entities, sync=sync)


def _numeric_values(type_, values):
    values = [type_.to_number(v) for v in ensure_list(values)]
    return [v for v in values if v is not None]


def get_geopoints(proxy: EntityProxy) -> list[dict[str, str]]:
    points = []
    if proxy.schema.is_a("Address"):
        lons = proxy.get("longitude")
        lats = proxy.get("latitude")
        for lon, lat in itertools.product(lons, lats):
            points.append({"lon": lon, "lat": lat})
    return points


def format_proxy(proxy, collection):
    """Apply final denormalisations to the index."""
    # Abstract entities can appear when profile fragments for a missing entity
    # are present.
    if proxy.schema.abstract:
        log.warning("Tried to index an abstract-typed entity: %r", proxy)
        return None

    # FIXME
    # a hack to display text previews in search for `Pages` `bodyText` property
    # will be removed again in `views.serializers.EntitySerializer` to reduce
    # api response size
    if proxy.schema.name == "Pages":
        proxy.add("bodyText", " ".join(proxy.get("indexText")))
    data = proxy.to_full_dict(matchable=True)
    data["schemata"] = list(proxy.schema.names)
    data["caption"] = proxy.caption

    names = data.get("names", [])
    fps = set([fingerprints.generate(name) for name in names])
    fps.update(names)
    data["fingerprints"] = [fp for fp in fps if fp is not None]

    # Slight hack: a magic property in followthemoney that gets taken out
    # of the properties and added straight to the index text.
    properties = data.get("properties")
    data["text"] = properties.pop("indexText", [])

    # integer casting
    numeric = {}
    for prop in proxy.iterprops():
        if prop.type in NUMERIC_TYPES:
            values = proxy.get(prop)
            numeric[prop.name] = _numeric_values(prop.type, values)
    # also cast group field for dates
    numeric["dates"] = _numeric_values(registry.date, data.get("dates"))
    data["numeric"] = numeric

    # geo data if entity is an Address
    if proxy.schema.is_a("Address"):
        data["geo_point"] = get_geopoints(proxy)

    # Context data - from aleph system, not followthemoney.
    data["collection_id"] = collection.id
    data["role_id"] = first(data.get("role_id"))
    data["profile_id"] = first(data.get("profile_id"))
    data["mutable"] = max(ensure_list(data.get("mutable")), default=False)
    data["origin"] = ensure_list(data.get("origin"))
    # Logical simplifications of dates:
    created_at = ensure_list(data.get("created_at"))
    if len(created_at) > 0:
        data["created_at"] = min(created_at)
    updated_at = ensure_list(data.get("updated_at")) or created_at
    if len(updated_at) > 0:
        data["updated_at"] = max(updated_at)

    # log.info("%s", pformat(data))
    entity_id = data.pop("id")
    return {
        "_id": entity_id,
        "_index": entities_write_index(proxy.schema),
        "_source": data,
    }


def delete_entity(entity_id, exclude=None, sync=False):
    """Delete an entity from the index."""
    if exclude is not None:
        exclude = entities_write_index(exclude)
    for entity in entities_by_ids(entity_id, excludes="*"):
        index = entity.get("_index")
        if index == exclude:
            continue
        delete_safe(index, entity_id)


def checksums_count(checksums):
    """Query how many documents mention a checksum."""
    schemata = model.get_type_schemata(registry.checksum)
    index = entities_read_index(schemata)
    body = []
    for checksum in checksums:
        body.append({"index": index})
        query = {"term": {registry.checksum.group: checksum}}
        body.append({"size": 0, "query": query})
    results = es.msearch(body=body)
    for checksum, result in zip(checksums, results.get("responses", [])):
        total = result.get("hits", {}).get("total", {}).get("value", 0)
        yield checksum, total
