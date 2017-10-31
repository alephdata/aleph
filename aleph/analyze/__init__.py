from __future__ import absolute_import
import logging
from timeit import default_timer as timer
from polyglot.downloader import downloader

from aleph.core import celery, db
from aleph.ext import get_analyzers
from aleph.model import Document
from aleph.index import index_document, index_records


log = logging.getLogger(__name__)


def install_analyzers():
    """Download linguistic resources for the analyzers."""
    for task in ['embeddings2', 'ner2']:
        log.info("Downloading linguistic resources: %r...", task)
        downloader.download('TASK:%s' % task, quiet=True)


@celery.task()
def analyze_document_id(document_id):
    """Analyze a document after looking it up by ID."""
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    analyze_document(document)


def analyze_document(document):
    """Run analyzers (such as NER) on a given document."""
    log.info("Analyze document [%s]: %s",
             document.id, document.title)
    start = timer()

    for cls in get_analyzers():
        analyzer = cls()
        if not analyzer.disabled:
            analyzer.analyze(document)

    db.session.add(document)
    db.session.commit()
    end = timer()
    log.info("Completed analysis [%s]: %s (elapsed: %.2fs)",
             document.id, document.title, end - start)

    # next: update the search index.
    index_document(document)
    index_records(document)
