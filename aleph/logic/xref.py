import logging
from pprint import pprint  # noqa
from elasticsearch.helpers import scan

from aleph.core import db, es, es_index
from aleph.model import Match
from aleph.index import TYPE_ENTITY, TYPE_DOCUMENT
from aleph.index.xref import entity_query
from aleph.index.util import unpack_result

log = logging.getLogger(__name__)


def xref_item(item):
    """Cross-reference an entity or document, given as an indexed document."""
    title = item.get('name') or item.get('title')
    log.info("Xref [%s]: %s", item['$type'], title)

    result = es.search(index=es_index,
                       doc_type=TYPE_ENTITY,
                       body={
                           'query': entity_query(item),
                           'size': 100,
                           '_source': ['collection_id'],
                       })
    results = result.get('hits').get('hits')
    entity_id, document_id = None, None
    if item.get('$type') == TYPE_DOCUMENT:
        document_id = item.get('id')
    else:
        entity_id = item.get('id')
    dq = db.session.query(Match)
    dq = dq.filter(Match.entity_id == entity_id)
    dq = dq.filter(Match.document_id == document_id)
    dq.delete()
    matches = []
    for result in results:
        source = result.get('_source', {})
        obj = Match()
        obj.entity_id = entity_id
        obj.document_id = document_id
        obj.collection_id = item.get('collection_id')
        obj.match_id = result.get('_id')
        obj.match_collection_id = source.get('collection_id')
        obj.score = result.get('_score')
        matches.append(obj)
    db.session.bulk_save_objects(matches)


def xref_collection(collection):
    """Cross-reference all the entities and documents in a collection."""
    log.info("Cross-reference collection: %r", collection)
    query = {
        'query': {
            'term': {'collection_id': collection.id}
        }
    }
    scanner = scan(es,
                   index=es_index,
                   doc_type=[TYPE_ENTITY, TYPE_DOCUMENT],
                   query=query)
    for i, res in enumerate(scanner):
        xref_item(unpack_result(res))
        if i % 1000 == 0 and i != 0:
            db.session.commit()
    db.session.commit()
