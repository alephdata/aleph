import logging
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.compare import compare

from aleph.core import db, celery
from aleph.model import Match, Document
from aleph.index.core import entities_index
from aleph.index.match import match_query
from aleph.index.entities import iter_entities
from aleph.index.util import search_safe, unpack_result, none_query

log = logging.getLogger(__name__)
EXCLUDES = ['text', 'roles']


def xref_item(item, collection_id=None):
    """Cross-reference an entity or document, given as an indexed document."""
    query = match_query(item, collection_id=collection_id)
    if query == none_query():
        return

    query = {
        'query': query,
        'size': 100,
        '_source': {'excludes': EXCLUDES}
    }
    result = search_safe(index=entities_index(), body=query)
    results = result.get('hits').get('hits')
    for result in results:
        result = unpack_result(result)
        collection_id = result.get('collection_id')
        result = model.get_proxy(result)
        score = compare(model, item, result)
        yield score, collection_id, result


@celery.task()
def xref_collection(collection_id, other_id=None):
    """Cross-reference all the entities and documents in a collection."""
    matchable = [s.name for s in model if s.matchable]
    entities = iter_entities(collection_id=collection_id,
                             schemata=matchable,
                             excludes=EXCLUDES)
    for entity in entities:
        proxy = model.get_proxy(entity)
        entity_id, document_id = None, None
        if Document.SCHEMA in proxy.schema.names:
            document_id = proxy.id
        else:
            entity_id = proxy.id

        dq = db.session.query(Match)
        dq = dq.filter(Match.entity_id == entity_id)
        dq = dq.filter(Match.document_id == document_id)
        if other_id is not None:
            dq = dq.filter(Match.match_collection_id == other_id)
        dq.delete()
        matches = xref_item(entity, collection_id=other_id)
        for (score, other_id, other) in matches:
            log.info("Xref [%.1f]: %s <=> %s", score, proxy, other)
            obj = Match()
            obj.entity_id = entity_id
            obj.document_id = document_id
            obj.collection_id = collection_id
            obj.match_id = other.id
            obj.match_collection_id = other_id
            obj.score = score
            db.session.add(obj)
        db.session.commit()
