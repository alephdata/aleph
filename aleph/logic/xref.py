import logging
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.compare import compare

from aleph.core import db, celery
from aleph.model import Match, Document
from aleph.index.core import entities_index
from aleph.index.xref import entity_query, NO_QUERY
from aleph.index.entities import iter_entities
from aleph.index.util import search_safe, unpack_result

log = logging.getLogger(__name__)
EXCLUDES = ['text', 'roles']


def xref_item(item, collection_id=None):
    """Cross-reference an entity or document, given as an indexed document."""
    query = entity_query(item, collection_id=collection_id)
    if query == NO_QUERY:
        return

    query = {
        'query': query,
        'size': 30,
        '_source': {'excludes': EXCLUDES}
    }
    result = search_safe(index=entities_index(), body=query)
    results = result.get('hits').get('hits')
    for result in results:
        result = unpack_result(result)
        score = compare(model, item, result)
        yield score, result


@celery.task()
def xref_collection(collection_id, other_id=None):
    """Cross-reference all the entities and documents in a collection."""
    matchable = [s.name for s in model if s.matchable]
    entities = iter_entities(collection_id=collection_id,
                             schemata=matchable,
                             excludes=EXCLUDES)
    for entity in entities:
        name = entity.get('name')
        entity_id, document_id = None, None
        if Document.SCHEMA in entity.get('schemata'):
            document_id = entity.get('id')
        else:
            entity_id = entity.get('id')

        dq = db.session.query(Match)
        dq = dq.filter(Match.entity_id == entity_id)
        dq = dq.filter(Match.document_id == document_id)
        if other_id is not None:
            dq = dq.filter(Match.match_collection_id == other_id)
        dq.delete()
        for (score, other) in xref_item(entity, collection_id=other_id):
            log.info("Xref [%.1f]: %s <=> %s", score, name, other.get('name'))
            obj = Match()
            obj.entity_id = entity_id
            obj.document_id = document_id
            obj.collection_id = collection_id
            obj.match_id = other.get('id')
            obj.match_collection_id = other.get('collection_id')
            obj.score = score
            db.session.add(obj)
        db.session.commit()
