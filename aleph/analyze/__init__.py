import logging

from aleph.core import celery
from aleph.ext import get_analyzers
from aleph.model import Document
from aleph.index import index_document


log = logging.getLogger(__name__)


@celery.task()
def analyze_source(source_id):
    pass


@celery.task()
def analyze_matches(query):
    pass


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
