import logging
from elasticsearch.helpers import bulk, scan

from aleph.core import get_es, get_es_index
from aleph.text import latinize_text
from aleph.index.mapping import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.index.util import expand_json

log = logging.getLogger(__name__)


def delete_entity(entity_id):
    """Delete an entity from the index."""
    get_es().delete(index=get_es_index(), doc_type=TYPE_ENTITY, id=entity_id,
                    ignore=[404])

    q = {'query': {'term': {'entities.uuid': entity_id}}}

    def updates():
        for res in scan(get_es(), query=q, index=get_es_index(),
                        doc_type=[TYPE_DOCUMENT]):
            entities = []
            for ent in res.get('_source').get('entities'):
                if ent['uuid'] != entity_id:
                    entities.append(ent)
            body = res.get('_source')
            body['entities'] = entities
            yield {
                '_id': res['_id'],
                '_type': res['_type'],
                '_index': res['_index'],
                '_source': body
            }
    try:
        bulk(get_es(), updates(), stats_only=True, chunk_size=100,
             request_timeout=120.0)
    except Exception:
        log.debug("Failed to clear entity refs: %r", entity_id)


def get_count(entity):
    """Inaccurate, as it does not reflect auth."""
    q = {'term': {'entities.uuid': entity.id}}
    q = {'size': 0, 'query': q}
    result = get_es().search(index=get_es_index(),
                             doc_type=TYPE_DOCUMENT,
                             body=q)
    return result.get('hits', {}).get('total', 0)


def index_entity(entity):
    """Index an entity."""
    data = entity.to_dict()
    data.pop('id', None)
    data['doc_count'] = get_count(entity)
    data['collection_id'] = data.get('collections')
    data['terms'] = entity.terms
    data['terms_latin'] = [latinize_text(t) for t in entity.terms]
    data['name_latin'] = latinize_text(data.get('name'))
    data['summary_latin'] = latinize_text(data.get('summary'))
    data['description_latin'] = latinize_text(data.get('description'))
    data = expand_json(data)
    get_es().index(index=get_es_index(), doc_type=TYPE_ENTITY,
                   id=entity.id, body=data)
