import logging

from aleph.core import celery
from aleph.ext import get_analyzers
from aleph.model import Document, Watchlist, Entity
from aleph.model import clear_session
from aleph.index import index_document
from aleph.search import raw_iter
from aleph.search.documents import text_query


log = logging.getLogger(__name__)


@celery.task()
def analyze_source(source_id):
    query = {'term': {'source_id': source_id}}
    analyze_matches(query)


@celery.task()
def analyze_entity(entity_id):
    query = {'term': {'entities.entity_id': entity_id}}
    analyze_matches(query)
    entity = Entity.by_id(entity_id)
    if entity is not None:
        analyze_terms(entity.terms)


@celery.task()
def analyze_terms(terms):
    ignore = set()
    for term in terms:
        q = text_query(term)
        ignore = analyze_matches(q, ignore=ignore)


def analyze_matches(query, ignore=None):
    if 'query' not in query:
        query = {'query': query}
    query['_source'] = []
    if ignore is None:
        ignore = set([])
    for row in raw_iter(query):
        doc_id = row.get('_id')
        if doc_id in ignore:
            continue
        analyze_document.delay(doc_id)


@celery.task()
def analyze_document(document_id):
    clear_session()
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    log.info("Analyze document: %r", document)
    for cls in get_analyzers():
        cls().analyze(document, document.meta)
    index_document(document_id)
