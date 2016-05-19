from __future__ import absolute_import
import logging
from polyglot.downloader import downloader

from aleph.core import celery
from aleph.ext import get_analyzers
from aleph.text import normalize_strong
from aleph.model import Document, Entity
from aleph.search.fragments import text_query_string, meta_query_string
from aleph.search.fragments import child_record
from aleph.index import index_document
from aleph.search import scan_iter


log = logging.getLogger(__name__)


def install_analyzers():
    # ['pos2', 'ner2', 'morph2', 'tsne2', 'counts2', 'embeddings2',
    #  'sentiment2', 'sgns2', 'transliteration2']
    for task in ['embeddings2', 'ner2']:
        log.info("Downloading linguistic resources: %r...", task)
        downloader.download('TASK:%s' % task, quiet=True)


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
    query = {'term': {'entities.uuid': entity_id}}
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
        term = normalize_strong(term)
        query = {
            "bool": {
                "minimum_should_match": 1,
                "should": [
                    meta_query_string(term),
                    child_record({
                        "bool": {
                            "should": [text_query_string(term)]
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
    try:
        for cls in get_analyzers():
            cls().analyze(document, document.meta)
        index_document(document_id)
    except Exception as ex:
        log.exception(ex)
