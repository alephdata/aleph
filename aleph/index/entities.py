from time import time
import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from datetime import datetime
from collections import defaultdict
from followthemoney import model
from followthemoney.util import merge_data
from elasticsearch.helpers import scan, bulk, BulkIndexError

from aleph.core import es
from aleph.model import Document
from aleph.index.indexes import entities_write_index, entities_read_index
from aleph.index.util import unpack_result, index_form, refresh_sync
from aleph.index.util import index_safe, search_safe, authz_query
from aleph.index.util import TIMEOUT, REQUEST_TIMEOUT, MAX_PAGE

log = logging.getLogger(__name__)
EXCLUDE_DEFAULT = ['text', 'fingerprints', 'names', 'phones', 'emails',
                   'identifiers', 'addresses']


def index_entity(entity, sync=False):
    """Index an entity."""
    if entity.deleted_at is not None:
        return delete_entity(entity.id)

    context = {'foreign_id': entity.foreign_id}
    return index_single(entity, entity.to_proxy(), context, [], sync=sync)


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
    includes = ensure_list(includes)
    excludes = ensure_list(excludes)
    if not len(excludes):
        excludes = EXCLUDE_DEFAULT
    query = {
        'query': {'bool': {'filter': filters}},
        '_source': {'includes': includes, 'excludes': excludes}
    }
    index = entities_read_index(schema=schemata)
    for res in scan(es, index=index, query=query, scroll='1410m'):
        entity = unpack_result(res)
        if entity is not None:
            yield entity


def iter_proxies(**kw):
    document = model.get(Document.SCHEMA)
    includes = ['schema', 'properties']
    for data in iter_entities(includes=includes, **kw):
        schema = model.get(data.get('schema'))
        if schema is None:
            continue
        if 'properties' not in data and schema.is_a(document):
            data.update(Document.doc_data_to_schema(data))
        yield model.get_proxy(data)


def entities_by_ids(ids, schemata=None, source=None):
    """Iterate over unpacked entities based on a search for the given
    entity IDs."""
    ids = ensure_list(ids)
    index = entities_read_index(schema=schemata)
    if source is None:
        source = {'excludes': ['text']}
    query = {
        'query': {
            'bool': {
                'filter': {'ids': {'values': ids}}
            }
        },
        '_source': source,
        'size': MAX_PAGE
    }
    result = search_safe(index=index, body=query)
    for doc in result.get('hits', {}).get('hits', []):
        entity = unpack_result(doc)
        if entity is not None:
            yield entity


def get_entity(entity_id, **kwargs):
    """Fetch an entity from the index."""
    for entity in entities_by_ids(ensure_list(entity_id)):
        return entity


def _index_updates(collection_id, entities, merge=True):
    """Look up existing index documents and generate an updated form.

    This is necessary to make the index accumulative, i.e. if an entity or link
    gets indexed twice with different field values, it'll add up the different
    field values into a single record. This is to avoid overwriting the
    document and losing field values. An alternative solution would be to
    implement this in Groovy on the ES.
    """
    common = {
        'collection_id': collection_id,
        'updated_at': datetime.utcnow(),
        'bulk': True
    }
    timestamps = {}
    indexes = defaultdict(list)
    if not len(entities):
        return []

    if merge:
        for result in entities_by_ids(list(entities.keys())):
            if int(result.get('collection_id')) != collection_id:
                raise RuntimeError("Key collision between collections.")
            existing = model.get_proxy(result)
            indexes[existing.id].append(result.get('_index'))
            entities[existing.id].merge(existing)
            timestamps[existing.id] = result.get('created_at')

    actions = []
    for entity_id, entity in entities.items():
        context = dict(common)
        context['created_at'] = timestamps.get(entity.id)
        body = finalize_index(entity, context, [])
        index = entities_write_index(entity.schema)
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
    try:
        start_time = time()
        actions = _index_updates(collection_id, entities, merge=merge)
        bulk(es, actions,
             chunk_size=len(actions) + 1,
             max_retries=10,
             initial_backoff=2,
             request_timeout=REQUEST_TIMEOUT,
             timeout=TIMEOUT,
             refresh=refresh_sync(True))
        duration = (time() - start_time)
        log.info("Bulk write: %.4fs", duration)
    except BulkIndexError as exc:
        log.warning('Indexing error: %s', exc)


def delete_entity(entity_id, exclude=None, sync=False):
    """Delete an entity from the index."""
    if exclude is not None:
        exclude = entities_write_index(exclude)
    for entity in entities_by_ids(entity_id, source=False):
        index = entity.get('_index')
        if index == exclude:
            continue
        refresh = refresh_sync(True)
        es.delete(index=index, doc_type='doc', id=entity_id, refresh=refresh)


def finalize_index(proxy, context, texts):
    """Apply final denormalisations to the index."""
    entity = proxy.to_full_dict()
    data = merge_data(context, entity)
    data['name'] = data.get('name', proxy.caption)
    data['text'] = index_form(texts)

    names = ensure_list(data.get('names'))
    fps = set([fingerprints.generate(name) for name in names])
    fps.update(names)
    fps.discard(None)
    data['fingerprints'] = list(fps)

    if not data.get('created_at'):
        data['created_at'] = data.get('updated_at')
    data.pop('id', None)
    data.pop('_index', None)
    # return clean_dict(data)
    return data


def index_single(obj, proxy, data, texts, sync=False):
    """Indexing aspects common to entities and documents."""
    data = finalize_index(proxy, data, texts)
    data['bulk'] = False
    data['collection_id'] = obj.collection_id
    data['created_at'] = obj.created_at
    data['updated_at'] = obj.updated_at
    # pprint(data)
    index = entities_write_index(proxy.schema)
    refresh = refresh_sync(sync)
    # This is required if an entity changes its type:
    # delete_entity(obj.id, exclude=proxy.schema, sync=False)
    return index_safe(index, obj.id, data, refresh=refresh)
