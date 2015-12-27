import json
import logging

from aleph.core import celery
from aleph.ext import get_analyzers
from aleph.model import Document
from aleph.index import index_document
from aleph.search import raw_iter, construct_query


log = logging.getLogger(__name__)


@celery.task()
def analyze_source(source_id):
    query = {'term': {'source_id': source_id}}
    analyze_matches(query)


@celery.task()
def analyze_terms(terms):
    q = ' OR '.join(map(json.dumps, terms))
    q = construct_query({'q': q})
    analyze_matches(q)


@celery.task()
def analyze_matches(query):
    if 'query' not in query:
        query = {'query': query}
    query['_source'] = []
    for row in raw_iter(query):
        analyze_document.delay(row.get('_id'))


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
        except Exception as ex:
            log.exception(ex)
    index_document.delay(document_id)
