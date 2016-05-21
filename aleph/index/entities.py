import logging
from collections import defaultdict
from elasticsearch.helpers import bulk, scan

from aleph.core import get_es, get_es_index, db
from aleph.text import latinize_text
from aleph.model import Entity, Reference
from aleph.model.entity import collection_entity_table
from aleph.index.mapping import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.index.util import expand_json, bulk_op

log = logging.getLogger(__name__)


def delete_entity(entity_id):
    """Delete an entity from the index."""
    get_es().delete(index=get_es_index(), doc_type=TYPE_ENTITY, id=entity_id,
                    ignore=[404])


def document_updates(q, entity_id, references=None):
    scanner = scan(get_es(), query=q, index=get_es_index(),
                   doc_type=[TYPE_DOCUMENT])
    for res in scanner:
        body = res.get('_source')
        entities = []
        if references is not None:
            entities.append({
                'uuid': entity_id,
                'collection_id': references[res['_id']]
            })
        for ent in res.get('_source').get('entities'):
            if ent['uuid'] != entity_id:
                entities.append(ent)
        body['entities'] = entities
        yield {
            '_op_type': 'update',
            '_id': res['_id'],
            '_type': res['_type'],
            '_index': res['_index'],
            'doc': body
        }


def delete_entity_references(entity_id):
    q = {'query': {'term': {'entities.uuid': entity_id}}}
    bulk_op(document_updates(q, entity_id))


def update_entity_references(entity_id, max_query=1000):
    """Same as above but runs in bulk for a particular entity."""
    q = db.session.query(Reference.document_id)
    q = q.filter(Reference.entity_id == entity_id)
    q = q.filter(Entity.id == entity_id)
    q = q.filter(Entity.state == Entity.STATE_ACTIVE)
    q = q.filter(collection_entity_table.c.entity_id == Entity.id)
    q = q.add_column(collection_entity_table.c.collection_id)
    references = defaultdict(list)
    for row in q:
        references[str(row.document_id)].append(row.collection_id)

    ids = references.keys()
    for i in range(0, len(ids), max_query):
        q = {'query': {'ids': {'values': ids[i:i + max_query]}}}
        bulk_op(document_updates(q, entity_id, references))

    log.info("Clearing ES cache...")
    get_es().indices.clear_cache(index=get_es_index())


def get_count(entity):
    """Inaccurate, as it does not reflect auth."""
    q = {'term': {'entities.uuid': entity.id}}
    q = {'size': 0, 'query': q}
    result = get_es().search(index=get_es_index(),
                             doc_type=TYPE_DOCUMENT,
                             body=q)
    return result.get('hits', {}).get('total', 0)


def generate_entities(document):
    entities = []
    seen = set()
    for reference in document.references:
        if reference.entity_id in seen:
            continue
        seen.add(reference.entity_id)
        colls = [c.id for c in reference.entity.collections]
        if reference.entity.state != Entity.STATE_ACTIVE:
            continue
        entities.append({
            'uuid': reference.entity.id,
            'collection_id': colls
        })
    return entities


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
