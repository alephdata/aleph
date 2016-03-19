import logging

from aleph.core import celery
from aleph.ext import get_analyzers
from aleph.model import Document, Entity
from aleph.model import clear_session
from aleph.index import index_document
from aleph.search import scan_iter, TYPE_RECORD
from aleph.util import latinize_text


log = logging.getLogger(__name__)


def query_doc_ids(query):
    query = {
        'query': query,
        '_source': False
    }
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
        term = latinize_text(term)
        query = {
            "bool": {
                "minimum_should_match": 1,
                "should": [
                    {
                        "multi_match": {
                            "query": term,
                            "fields": ["title", "summary", "file_name",
                                       "title_latin", "summary_latin"]
                        }
                    },
                    {
                        "has_child": {
                            "type": TYPE_RECORD,
                            "query": {
                                "bool": {
                                    "should": [
                                        {
                                            "multi_match": {
                                                "query": term,
                                                "fields": ["text",
                                                           "text_latin"]
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            }
        }
        for doc_id in query_doc_ids(query):
            if doc_id not in seen:
                analyze_document.delay(doc_id)
            seen.add(doc_id)


@celery.task()
def analyze_document(document_id):
    # clear_session()
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    log.info("Analyze document: %r", document)
    for cls in get_analyzers():
        cls().analyze(document, document.meta)
    index_document(document_id)
