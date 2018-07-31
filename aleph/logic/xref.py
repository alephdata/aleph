import logging
from pprint import pprint  # noqa
from elasticsearch.helpers import scan

from aleph.core import db, es, celery
from aleph.model import Match, Document
from aleph.index.core import entities_index
from aleph.index.xref import entity_query
from aleph.index.util import unpack_result, search_safe

log = logging.getLogger(__name__)


def _xref_item(item, collection_id=None):
    """Cross-reference an entity or document, given as an indexed document."""
    name = item.get('name') or item.get('title')
    query = entity_query(item, collection_id=collection_id)
    if 'match_none' in query:
        return

    query = {
        'query': query,
        'size': 10,
        '_source': ['collection_id', 'name'],
    }
    result = search_safe(index=entities_index(), body=query)
    results = result.get('hits').get('hits')
    entity_id, document_id = None, None
    if Document.SCHEMA in item.get('schemata'):
        document_id = item.get('id')
    else:
        entity_id = item.get('id')

    dq = db.session.query(Match)
    dq = dq.filter(Match.entity_id == entity_id)
    dq = dq.filter(Match.document_id == document_id)
    if collection_id is not None:
        dq = dq.filter(Match.match_collection_id == collection_id)
    dq.delete()

    for result in results:
        source = result.get('_source', {})
        log.info("Xref [%.1f]: %s <=> %s", result.get('_score'),
                 name, source.get('name'))
        obj = Match()
        obj.entity_id = entity_id
        obj.document_id = document_id
        obj.collection_id = item.get('collection_id')
        obj.match_id = result.get('_id')
        obj.match_collection_id = source.get('collection_id')
        obj.score = result.get('_score')
        db.session.add(obj)
    db.session.commit()


@celery.task()
def xref_collection(collection_id, other_id=None):
    """Cross-reference all the entities and documents in a collection."""
    query = {'term': {'collection_id': collection_id}}
    query = {
        'query': query,
        '_source': {'excludes': ['text', 'roles', 'properties.*']}
    }
    scanner = scan(es,
                   index=entities_index(),
                   query=query,
                   scroll='1400m')
    for res in scanner:
        res = unpack_result(res)
        _xref_item(res, collection_id=other_id)
