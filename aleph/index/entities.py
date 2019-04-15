import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from datetime import datetime
from collections import defaultdict
from followthemoney import model
from elasticsearch.helpers import scan

from aleph.core import es, cache
from aleph.model import Entity
from aleph.index.indexes import entities_write_index, entities_read_index
from aleph.index.util import unpack_result, refresh_sync
from aleph.index.util import index_safe, authz_query, bulk_actions
from aleph.index.util import MAX_PAGE

log = logging.getLogger(__name__)
EXCLUDE_DEFAULT = ['text', 'fingerprints', 'names', 'phones', 'emails',
                   'identifiers', 'addresses', 'properties.bodyText',
                   'properties.bodyHtml', 'properties.headers']


def index_entity(entity, sync=False):
    """Index an entity."""
    if entity.deleted_at is not None:
        return delete_entity(entity.id)

    entity_id, index, data = index_operation(entity.to_dict())
    refresh = refresh_sync(sync)
    # This is required if an entity changes its type:
    # delete_entity(entity_id, exclude=proxy.schema, sync=False)
    return index_safe(index, entity_id, data, refresh=refresh)


def index_collection_entities(collection, sync=False):
    """Re-index all documents in a collection in one go."""
    from aleph.index.documents import generate_collection_docs

    def _generate():
        for entity in Entity.by_collection(collection.id):
            entity_id, index, body = index_operation(entity.to_dict())
            yield {
                '_id': entity_id,
                '_index': index,
                '_source': body
            }
        yield from generate_collection_docs(collection)

    bulk_actions(_generate(), sync=sync)


def _source_spec(includes, excludes):
    includes = ensure_list(includes)
    excludes = ensure_list(excludes)
    if not len(excludes):
        excludes = EXCLUDE_DEFAULT
    return {'includes': includes, 'excludes': excludes}


def iter_entities(authz=None, collection_id=None, schemata=None,
                  includes=None, excludes=None):
    """Scan all entities matching the given criteria."""
    filters = []
    if authz is not None:
        filters.append(authz_query(authz))
    if collection_id is not None:
        filters.append({'term': {'collection_id': collection_id}})
    if ensure_list(schemata):
        filters.append({'terms': {'schemata': ensure_list(schemata)}})
    query = {
        'query': {'bool': {'filter': filters}},
        '_source': _source_spec(includes, excludes)
    }
    index = entities_read_index(schema=schemata)
    for res in scan(es, index=index, query=query, scroll='1410m'):
        entity = unpack_result(res)
        if entity is not None:
            yield entity


def iter_proxies(**kw):
    includes = ['schema', 'properties']
    for data in iter_entities(includes=includes, **kw):
        schema = model.get(data.get('schema'))
        if schema is None:
            continue
        yield model.get_proxy(data)


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
            # Cache entities only briefly to avoid filling up the cache:
            if cached:
                key = cache.object_key(Entity, entity.get('id'))
                cache.set_complex(key, entity, expire=60 * 60)
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


def _index_updates(collection_id, entities, merge=True):
    """Look up existing index documents and generate an updated form.

    This is necessary to make the index accumulative, i.e. if an entity or link
    gets indexed twice with different field values, it'll add up the different
    field values into a single record. This is to avoid overwriting the
    document and losing field values. An alternative solution would be to
    implement this in Groovy on the ES.
    """
    indexes = defaultdict(list)
    timestamps = {}
    common = {
        'collection_id': collection_id,
        'updated_at': datetime.utcnow(),
        'bulk': True
    }

    if merge:
        for result in entities_by_ids(list(entities.keys())):
            existing = model.get_proxy(result)
            indexes[existing.id].append(result.get('_index'))
            entities[existing.id].merge(existing)
            timestamps[existing.id] = result.get('created_at')

    actions = []
    for entity_id, proxy in entities.items():
        entity = dict(common)
        created_at = timestamps.get(proxy.id, common.get('updated_at'))
        entity['created_at'] = created_at
        entity.update(proxy.to_full_dict())
        _, index, body = index_operation(entity)
        for other in indexes.get(entity_id, []):
            if other != index:
                # log.info("Delete ID [%s] from index: %s", entity_id, other)
                actions.append(delete_operation(other, entity_id))
        actions.append({
            '_id': entity_id,
            '_index': index,
            '_source': body
        })
    return actions


def index_bulk(collection_id, entities, merge=True):
    """Index a set of entities."""
    actions = _index_updates(collection_id, entities, merge=merge)
    bulk_actions(actions, sync=merge)


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


def index_operation(data):
    """Apply final denormalisations to the index."""
    data['bulk'] = data.get('bulk', False)
    names = ensure_list(data.get('names'))
    fps = set([fingerprints.generate(name) for name in names])
    fps.update(names)
    data['fingerprints'] = [fp for fp in fps if fp is not None]

    # Slight hack: a magic property in followthemoney that gets taken out
    # of the properties and added straight to the index text.
    texts = data.pop('text', [])
    texts.extend(data.get('properties', {}).pop('indexText', []))
    texts.extend(fps)
    data['text'] = texts

    if not data.get('created_at'):
        data['created_at'] = data.get('updated_at')

    entity_id = str(data.pop('id'))
    data.pop('_index', None)
    index = entities_write_index(data.get('schema'))
    return entity_id, index, data


def delete_operation(index, entity_id):
    return {
        '_id': entity_id,
        '_index': index,
        '_op_type': 'delete'
    }
