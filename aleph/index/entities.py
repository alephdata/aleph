import logging
import fingerprints
from pprint import pprint, pformat  # noqa
from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import es, cache
from aleph.model import Entity
from aleph.index.indexes import entities_write_index, entities_read_index
from aleph.index.util import unpack_result, refresh_sync
from aleph.index.util import authz_query, bulk_actions
from aleph.index.util import MAX_PAGE, NUMERIC_TYPES
from aleph.index.util import MAX_REQUEST_TIMEOUT, MAX_TIMEOUT


log = logging.getLogger(__name__)
PROXY_INCLUDES = ['schema', 'properties', 'collection_id']


def _source_spec(includes, excludes):
    includes = ensure_list(includes)
    excludes = ensure_list(excludes)
    return {'includes': includes, 'excludes': excludes}


def _cache_entity(entity):
    # Cache entities only briefly to avoid filling up redis
    key = cache.object_key(Entity, entity.get('id'))
    cache.set_complex(key, entity, expires=60 * 60 * 2)


def _entities_query(filters, authz, collection_id, schemata):
    filters = filters or []
    if authz is not None:
        filters.append(authz_query(authz))
    if collection_id is not None:
        filters.append({'term': {'collection_id': collection_id}})
    if ensure_list(schemata):
        filters.append({'terms': {'schemata': ensure_list(schemata)}})
    return {'bool': {'filter': filters}}


def get_field_type(field):
    field = field.split('.')[-1]
    if field in registry.groups:
        return registry.groups[field]
    for prop in model.properties:
        if prop.name == field:
            return prop.type
    return registry.string


def iter_entities(authz=None, collection_id=None, schemata=None,
                  includes=PROXY_INCLUDES, excludes=None, filters=None,
                  cached=False):
    """Scan all entities matching the given criteria."""
    query = {
        'query': _entities_query(filters, authz, collection_id, schemata),
        '_source': _source_spec(includes, excludes)
    }
    index = entities_read_index(schema=schemata)
    for res in scan(es, index=index, query=query,
                    timeout=MAX_TIMEOUT,
                    request_timeout=MAX_REQUEST_TIMEOUT):
        entity = unpack_result(res)
        if entity is not None:
            if cached:
                _cache_entity(entity)
            yield entity


def iter_proxies(**kw):
    for data in iter_entities(**kw):
        schema = model.get(data.get('schema'))
        if schema is None:
            continue
        yield model.get_proxy(data)


def iter_adjacent(entity):
    """Used for recursively deleting entities and their linked associations."""
    query = {'term': {'entities': entity.get('id')}}
    yield from iter_entities(includes=['collection_id'],
                             collection_id=entity.get('collection_id'),
                             filters=[query])


def entities_by_ids(ids, schemata=None, cached=False,
                    includes=PROXY_INCLUDES, excludes=None):
    """Iterate over unpacked entities based on a search for the given
    entity IDs."""
    ids = ensure_list(ids)
    if not len(ids):
        return
    index = entities_read_index(schema=schemata)
    query = {
        'query': {'ids': {'values': ids}},
        '_source': _source_spec(includes, excludes),
        'size': MAX_PAGE
    }
    result = es.search(index=index, body=query)
    for doc in result.get('hits', {}).get('hits', []):
        entity = unpack_result(doc)
        if entity is not None:
            if cached:
                _cache_entity(entity)
            yield entity


def get_entity(entity_id, **kwargs):
    """Fetch an entity from the index."""
    if entity_id is None:
        return
    if kwargs.get('includes') is None and kwargs.get('excludes') is None:
        key = cache.object_key(Entity, entity_id)
        entity = cache.get_complex(key)
        if entity is not None:
            return entity
        log.debug("Entity [%s]: cache miss", entity_id)
    for entity in entities_by_ids(entity_id, cached=True, **kwargs):
        return entity


def index_entity(entity, sync=False):
    """Index an entity."""
    if entity.deleted_at is not None:
        return delete_entity(entity.id, sync=sync)
    proxy = entity.to_proxy()
    return index_proxy(entity.collection, proxy, sync=sync)


def index_proxy(collection, proxy, sync=False):
    delete_entity(proxy.id, exclude=proxy.schema, sync=False)
    return index_bulk(collection, [proxy], {}, sync=sync)


def index_bulk(collection, entities, extra, sync=False):
    """Index a set of entities."""
    entities = (format_proxy(p, collection, extra) for p in entities)
    bulk_actions(entities, sync=sync)


def _numeric_values(type_, values):
    values = [type_.to_number(v) for v in ensure_list(values)]
    return [v for v in values if v is not None]


def format_proxy(proxy, collection, extra):
    """Apply final denormalisations to the index."""
    proxy.context = {}
    proxy = collection.ns.apply(proxy)
    # Pull `indexUpdatedAt` before constructing `data`, so that it doesn't
    # creep into `data['dates']` and mess up date sorting afterwards
    updated_at = proxy.pop('indexUpdatedAt', quiet=True)
    data = proxy.to_full_dict()
    data['collection_id'] = collection.id
    data['schemata'] = list(proxy.schema.names)

    names = ensure_list(data.get('names'))
    fps = set([fingerprints.generate(name) for name in names])
    fps.update(names)
    data['fingerprints'] = [fp for fp in fps if fp is not None]

    # Slight hack: a magic property in followthemoney that gets taken out
    # of the properties and added straight to the index text.
    properties = data.get('properties')
    text = properties.pop('indexText', [])
    text.extend(fps)
    data['text'] = text

    data['updated_at'] = collection.updated_at
    for value in updated_at:
        data['updated_at'] = value

    # integer casting
    numeric = {}
    for prop, values in properties.items():
        prop = proxy.schema.get(prop)
        if prop.type in NUMERIC_TYPES:
            numeric[prop.name] = _numeric_values(prop.type, values)
    # also cast group field for dates
    numeric['dates'] = _numeric_values(registry.date, data.get('dates'))
    data['numeric'] = numeric

    # add possible overrides
    data.update(extra)

    # log.info("%s", pformat(data))
    entity_id = data.pop('id')
    return {
        '_id': entity_id,
        '_index': entities_write_index(data.get('schema')),
        '_source': data
    }


def delete_entity(entity_id, exclude=None, sync=False):
    """Delete an entity from the index."""
    if exclude is not None:
        exclude = entities_write_index(exclude)
    for entity in entities_by_ids(entity_id, excludes='*'):
        index = entity.get('_index')
        if index == exclude:
            continue
        es.delete(index=index, id=entity_id, ignore=[404],
                  refresh=refresh_sync(sync))
