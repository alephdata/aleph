import logging

from aleph.core import celery
from aleph.ext import get_analyzers
from aleph.model import Document, Watchlist, Entity
from aleph.index import index_document
from aleph.search import raw_iter
from aleph.search.query import text_query


log = logging.getLogger(__name__)


@celery.task()
def analyze_source(source_id):
    query = {'term': {'source_id': source_id}}
    analyze_matches(query)


@celery.task()
def analyze_watchlist(watchlist_id):
    query = {'term': {'entities.watchlist_id': watchlist_id}}
    analyze_matches(query)
    watchlist = Watchlist.by_id(watchlist_id)
    if watchlist is not None:
        analyze_terms(watchlist.terms)


@celery.task()
def analyze_entity(entity_id):
    query = {'term': {'entities.entity_id': entity_id}}
    analyze_matches(query)
    entity = Entity.by_id(entity_id)
    if entity is not None:
        analyze_terms(entity.terms)


@celery.task()
def analyze_terms(terms):
    for term in terms:
        q = text_query(term)
        analyze_matches.delay(q)


@celery.task()
def analyze_matches(query):
    if 'query' not in query:
        query = {'query': query}
    query['_source'] = []
    for row in raw_iter(query):
        analyze_document(row.get('_id'))


@celery.task()
def analyze_document(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    log.info("Analyze document: %r", document)
    for cls in get_analyzers():
        try:
            cls().analyze(document, document.meta)
            index_document(document_id)
        except Exception as ex:
            log.exception(ex)
