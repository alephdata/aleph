import logging

from aleph import process
from aleph.core import celery
from aleph.ext import get_analyzers
from aleph.model import Document, Entity
from aleph.search.fragments import text_query_string, meta_query_string
from aleph.search.fragments import child_record
from aleph.index import index_document
from aleph.search import scan_iter


log = logging.getLogger(__name__)


def query_doc_ids(query):
    query = {'query': query, '_source': False}
    for row in scan_iter(query):
        yield row.get('_id')


@celery.task()
def analyze_source(source_id):
    query = {'term': {'source_id': source_id}}
    for doc_id in query_doc_ids(query):
        analyze_document.delay(doc_id)


@celery.task()
def analyze_entity(entity_id):
    seen = set()
    query = {'term': {'entities.entity_id': entity_id}}
    for doc_id in query_doc_ids(query):
        analyze_document.delay(doc_id)
        seen.add(doc_id)
    entity = Entity.by_id(entity_id)
    if entity is not None:
        analyze_terms(entity.terms, seen=seen)


@celery.task()
def analyze_terms(terms, seen=None):
    if seen is None:
        seen = set()
    for term in terms:
        query = {
            "bool": {
                "minimum_should_match": 1,
                "should": [
                    meta_query_string(term, literal=True),
                    child_record({
                        "bool": {
                            "should": [text_query_string(term, literal=True)]
                        }
                    })
                ]
            }
        }
        for doc_id in query_doc_ids(query):
            if doc_id not in seen:
                analyze_document.delay(doc_id)
            seen.add(doc_id)


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
            process.exception(process.ANALYZE, component=cls.__name__,
                              document_id=document.id, meta=document.meta,
                              source_id=document.source_id, exception=ex)
    index_document(document_id)
