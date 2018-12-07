import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from datetime import datetime
from collections import defaultdict
from followthemoney import model
from followthemoney.util import merge_data
from elasticsearch.helpers import scan, bulk, BulkIndexError

from aleph.core import es, settings, cache
from aleph.model import Document
from aleph.index.core import entities_write_index, entities_read_index
from aleph.index.util import unpack_result, index_form, refresh_sync
from aleph.index.util import index_safe, search_safe, authz_query, bool_query
from aleph.index.util import MAX_PAGE, TIMEOUT, REQUEST_TIMEOUT

log = logging.getLogger(__name__)


def index_entity(entity, sync=False):
    """Index an entity."""
    if entity.deleted_at is not None:
        return delete_entity(entity.id)

    context = {'foreign_id': entity.foreign_id}
    return index_single(entity, entity.to_proxy(), context, [], sync=sync)


def delete_entity(entity_id, exclude=None, sync=False):
    """Delete an entity from the index."""
    query = {'query': {'ids': {'values': str(entity_id)}}}
    es.delete_by_query(index=entities_read_index(exclude=exclude),
                       body=query,
                       wait_for_completion=sync,
                       refresh=refresh_sync(sync))


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
    source = {}
    if ensure_list(includes):
        source['includes'] = ensure_list(includes)
    if ensure_list(excludes):
        source['excludes'] = ensure_list(excludes)
    query = {
        'query': {'bool': {'filter': filters}},
        'sort': ['_doc'],
        '_source': source
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


def entities_by_ids(ids, authz=None, cached=True):
    """Iterate over unpacked entities based on a search for the given
    entity IDs."""
    for i in range(0, len(ids), MAX_PAGE):
        chunk = ids[i:i + MAX_PAGE]
        if not len(chunk):
            return
        query = bool_query()
        query['bool']['filter'].append({'ids': {'values': chunk}})
        if authz is not None:
            query['bool']['filter'].append(authz_query(authz))
        query = {
            'query': query,
            '_source': {'excludes': ['text']},
            'size': min(MAX_PAGE, len(chunk))
        }
        result = search_safe(index=entities_read_index(),
                             body=query,
                             ignore=[404],
                             request_cache=cached)
        for doc in result.get('hits', {}).get('hits', []):
            entity = unpack_result(doc)
            if entity is not None:
                yield entity


def get_entity(entity_id):
    """Fetch an entity from the index."""
    for entity in entities_by_ids(ensure_list(entity_id)):
        return entity


def _index_updates(collection_id, entities):
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

    for result in entities_by_ids(list(entities.keys()), cached=False):
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


def index_bulk(collection_id, entities):
    """Index a set of entities."""
    lock = cache.lock(cache.key('index_bulk'))
    lock.acquire(blocking=True)
    try:
        actions = _index_updates(collection_id, entities)
        chunk_size = len(actions) + 1
        return bulk(es, actions,
                    chunk_size=chunk_size,
                    max_retries=10,
                    initial_backoff=2,
                    request_timeout=REQUEST_TIMEOUT,
                    timeout=TIMEOUT,
                    refresh=refresh_sync(True))
    except BulkIndexError as exc:
        log.warning('Indexing error: %s', exc)
    finally:
        try:
            lock.release()
        except Exception:
            log.exception("Cannot release index lock.")


def finalize_index(proxy, context, texts):
    """Apply final denormalisations to the index."""
    for prop, value in proxy.itervalues():
        if prop.type.name in ['entity', 'date', 'url', 'country', 'language']:
            continue
        texts.append(value)

    entity = proxy.to_full_dict()
    data = merge_data(context, entity)
    data['name'] = proxy.caption
    data['text'] = index_form(texts)

    names = data.get('names', [])
    fps = [fingerprints.generate(name) for name in names]
    fps = [fp for fp in fps if fp is not None]
    data['fingerprints'] = list(set(fps))

    if not data.get('created_at'):
        data['created_at'] = data.get('updated_at')
    data.pop('id', None)
    # return clean_dict(data)
    return data


def index_single(obj, proxy, data, texts, sync=False):
    """Indexing aspects common to entities and documents."""
    data = finalize_index(proxy, data, texts)
    data['bulk'] = False
    data['collection_id'] = obj.collection.id
    data['created_at'] = obj.created_at
    data['updated_at'] = obj.updated_at
    # pprint(data)
    index = entities_write_index(proxy.schema)
    refresh = refresh_sync(sync)
    if settings.ENTITIES_INDEX_SPLIT:
        delete_entity(obj.id, exclude=proxy.schema, sync=False)
    return index_safe(index, obj.id, data, refresh=refresh)
