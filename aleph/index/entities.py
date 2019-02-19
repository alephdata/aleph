import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from datetime import datetime
from collections import defaultdict
from followthemoney import model
from elasticsearch.helpers import scan

from aleph.core import es
from aleph.index.indexes import entities_write_index, entities_read_index
# from aleph.index.indexes import entities_read_index_list
from aleph.index.util import unpack_result, refresh_sync
from aleph.index.util import index_safe, authz_query, bulk_actions
from aleph.index.util import MAX_PAGE

log = logging.getLogger(__name__)
EXCLUDE_DEFAULT = ['text', 'fingerprints', 'names', 'phones', 'emails',
                   'identifiers', 'addresses', 'properties.bodyText',
                   'properties.bodyRaw']


def index_entity(entity, sync=False):
    """Index an entity."""
    if entity.deleted_at is not None:
        return delete_entity(entity.id)

    entity_id, index, data = index_operation(entity.to_dict())
    refresh = refresh_sync(sync)
    # This is required if an entity changes its type:
    # delete_entity(entity_id, exclude=proxy.schema, sync=False)
    return index_safe(index, entity_id, data, refresh=refresh)


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


def entities_by_ids(ids, schemata=None, includes=None, excludes=None):
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
            yield entity


# def entities_by_typed_ids(schema_ids, includes=None, excludes=None):
#     docs = []
#     spec = _source_spec(includes, excludes)
#     for (schema, id) in schema_ids:
#         for index in entities_read_index_list(schema):
#             docs.append({
#                 '_index': index,
#                 '_type': 'doc',
#                 '_id': id,
#                 '_source': spec
#             })
#     if not len(docs):
#         return
#     for doc in es.mget(body={'docs': docs}):
#         entity = unpack_result(doc)
#         if entity is not None:
#             yield entity


def get_entity(entity_id, **kwargs):
    """Fetch an entity from the index."""
    for entity in entities_by_ids(entity_id):
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
        entity['created_at'] = timestamps.get(proxy.id)
        entity.update(proxy.to_full_dict())
        _, index, body = index_operation(entity)
        for other in indexes.get(entity_id, []):
            if other != index:
                # log.info("Delete ID [%s] from index: %s", entity_id, other)
                actions.append({
                    '_id': entity_id,
                    '_index': other,
                    '_type': 'doc',
                    '_op_type': 'delete'
                })
        actions.append({
            '_id': entity_id,
            '_index': index,
            '_type': 'doc',
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
        es.delete(index=index, doc_type='doc', id=entity_id,
                  refresh=refresh_sync(sync))


def index_operation(data):
    """Apply final denormalisations to the index."""
    data['bulk'] = data.get('bulk', False)
    names = ensure_list(data.get('names'))
    fps = set([fingerprints.generate(name) for name in names])
    fps.update(names)
    fps.discard(None)
    data['fingerprints'] = list(fps)

    if not data.get('created_at'):
        data['created_at'] = data.get('updated_at')

    entity_id = data.pop('id')
    data.pop('_index', None)
    schema = model.get(data.get('schema'))
    index = entities_write_index(schema)
    return entity_id, index, data
