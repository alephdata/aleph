from __future__ import absolute_import
import logging
from polyglot.downloader import downloader

from aleph.core import celery
from aleph.ext import get_analyzers
from aleph.model import Document
from aleph.index import index_document
from aleph.search import scan_iter


log = logging.getLogger(__name__)


def install_analyzers():
    # ['pos2', 'ner2', 'morph2', 'tsne2', 'counts2', 'embeddings2',
    #  'sentiment2', 'sgns2', 'transliteration2']
    for task in ['embeddings2', 'ner2']:
        log.info("Downloading linguistic resources: %r...", task)
        downloader.download('TASK:%s' % task, quiet=True)


@celery.task()
def analyze_source(source_id):
    query = {'term': {'source_id': source_id}}
    query = {'query': query, '_source': False}
    for row in scan_iter(query):
        analyze_document.delay(row.get('_id'))


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
    except Exception as ex:
        log.exception(ex)
    index_document(document_id)
