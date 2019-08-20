import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import es, cache
from aleph.model import Entity
from aleph.index.indexes import entities_write_index, entities_read_index
from aleph.index.util import unpack_result, refresh_sync
from aleph.index.util import authz_query, query_delete, bulk_actions
from aleph.index.util import MAX_PAGE

log = logging.getLogger(__name__)
EXCLUDE_DEFAULT = ['text', 'fingerprints', 'names', 'phones', 'emails',
                   'identifiers', 'addresses', 'properties.bodyText',
                   'properties.bodyHtml', 'properties.headers']


def _source_spec(includes, excludes):
    includes = ensure_list(includes)
    excludes = ensure_list(excludes)
    if not len(excludes):
        excludes = EXCLUDE_DEFAULT
    return {'includes': includes, 'excludes': excludes}


def _cache_entity(entity):
    # Cache entities only briefly to avoid filling up redis
    key = cache.object_key(Entity, entity.get('id'))
    cache.set_complex(key, entity, expire=60 * 60 * 2)


def _entities_query(filters, authz, collection_id, schemata):
    filters = filters or []
    if authz is not None:
        filters.append(authz_query(authz))
    if collection_id is not None:
        filters.append({'term': {'collection_id': collection_id}})
    if ensure_list(schemata):
        filters.append({'terms': {'schemata': ensure_list(schemata)}})
    return {'bool': {'filter': filters}}


def _get_field_type(field):
    field = field.split('.')[-1]
    if field in registry.groups:
        return registry.groups[field]
    if not hasattr(_get_field_type, 'fields'):
        _get_field_type.fields = {
            field.split(':')[-1]: prop for field, prop in model.qnames.items()
        }
    prop = _get_field_type.fields.get(field)
    if prop:
        return prop.type


def iter_entities(authz=None, collection_id=None, schemata=None,
                  includes=None, excludes=None, filters=None, cached=False):
    """Scan all entities matching the given criteria."""
    query = {
        'query': _entities_query(filters, authz, collection_id, schemata),
        '_source': _source_spec(includes, excludes)
    }
    index = entities_read_index(schema=schemata)
    for res in scan(es, index=index, query=query, scroll='1410m'):
        entity = unpack_result(res)
        if entity is not None:
            if cached:
                _cache_entity(entity)
            yield entity


def iter_proxies(**kw):
    includes = ['schema', 'properties']
    for data in iter_entities(includes=includes, **kw):
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
                    includes=None, excludes=None):
    """Iterate over unpacked entities based on a search for the given
    entity IDs."""
    ids = ensure_list(ids)
    if not len(ids):
        return
    index = entities_read_index(schema=schemata)
    query = {'ids': {'values': ids}}
    # query = {'bool': {'filter': query}}
    query = {
        'query': query,
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
    key = cache.object_key(Entity, entity_id)
    entity = cache.get_complex(key)
    if entity is not None:
        return entity
    log.debug("Entity [%s]: object cache miss", entity_id)
    for entity in entities_by_ids(entity_id, cached=True):
        return entity


def index_entity(entity, sync=False):
    """Index an entity."""
    if entity.deleted_at is not None:
        return delete_entity(entity.id)
    proxy = entity.to_proxy()
    return index_proxy(entity.collection, proxy, sync=sync)


def index_proxy(collection, proxy, sync=False):
    delete_entity(proxy.id, exclude=proxy.schema, sync=False)
    return index_bulk(collection, [proxy], sync=sync)


def index_bulk(collection, entities, job_id=None, sync=False):
    """Index a set of entities."""
    actions = []
    for entity in entities:
        actions.append(format_proxy(entity, collection, job_id=job_id))
    bulk_actions(actions, sync=sync)


def format_proxy(proxy, collection, job_id=None):
    """Apply final denormalisations to the index."""
    proxy.context = {}
    data = proxy.to_full_dict()
    data['collection_id'] = collection.id
    data['job_id'] = job_id
    names = ensure_list(data.get('names'))
    fps = set([fingerprints.generate(name) for name in names])
    fps.update(names)
    data['fingerprints'] = [fp for fp in fps if fp is not None]

    # Slight hack: a magic property in followthemoney that gets taken out
    # of the properties and added straight to the index text.
    properties = data.get('properties')
    text = properties.pop('indexText', [])
    text.extend(fps)
    text.append(collection.label)
    data['text'] = text

    data['updated_at'] = collection.updated_at
    for updated_at in properties.pop('indexUpdatedAt', []):
        data['updated_at'] = updated_at

    # integer casting
    extra_props = {}
    for prop in properties:
        prop = proxy._get_prop(prop)
        if prop.type in (registry.number, registry.date):
            num_sub_prop = "%s:num" % prop.name
            vals = ensure_list(properties.get(prop.name, []))
            num_vals = [prop.type.to_number(v) for v in vals]
            extra_props[num_sub_prop] = num_vals
    data['properties'].update(extra_props)

    # pprint(data)
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
        es.delete(index=index, id=entity_id,
                  refresh=refresh_sync(sync))
        q = {'term': {'entities': entity_id}}
        query_delete(entities_read_index(), q, sync=sync)
