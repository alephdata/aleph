import logging
from pprint import pprint  # noqa
from elasticsearch.helpers import scan

from aleph.core import db, es, celery
from aleph.model import Match, Collection, Document
from aleph.index.core import entities_index
from aleph.index.xref import entity_query, FIELDS_XREF
from aleph.index.util import unpack_result

log = logging.getLogger(__name__)


@celery.task()
def xref_item(item, collection_id=None):
    """Cross-reference an entity or document, given as an indexed document."""
    name = item.get('name') or item.get('title')
    result = es.search(index=entities_index(),
                       body={
                           'query': entity_query(item, collection_id),
                           'size': 10,
                           '_source': ['collection_id', 'name'],
                       })
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


def xref_collection(collection, other=None):
    """Cross-reference all the entities and documents in a collection."""
    log.info("Cross-reference collection: %r", collection)
    other_id = other.id if other is not None else None
    query = {
        'query': {
            'term': {'collection_id': collection.id}
        },
        '_source': FIELDS_XREF
    }
    scanner = scan(es,
                   index=entities_index(),
                   query=query,
                   scroll='15m')

    for i, res in enumerate(scanner):
        xref_item.apply_async([unpack_result(res), other_id], priority=4)


@celery.task()
def process_xref(collection_id, other_id=None):
    q = db.session.query(Collection).filter(Collection.id == collection_id)
    collection = q.first()
    if collection is None:
        log.error("No collection with ID: %r", collection_id)

    if other_id is not None:
        q = db.session.query(Collection).filter(Collection.id == other_id)
        other = q.first()
    else:
        other = None

    xref_collection(collection, other)
