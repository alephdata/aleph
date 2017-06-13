from __future__ import absolute_import
import logging
from timeit import default_timer as timer
from polyglot.downloader import downloader

from aleph.core import celery, db
from aleph.ext import get_analyzers
from aleph.model import Document
from aleph.index import index_document, index_records
from aleph.search import TYPE_DOCUMENT, scan_iter


log = logging.getLogger(__name__)


def install_analyzers():
    """Download linguistic resources for the analyzers."""
    # ['pos2', 'ner2', 'morph2', 'tsne2', 'counts2', 'embeddings2',
    #  'sentiment2', 'sgns2', 'transliteration2']
    for task in ['embeddings2', 'ner2']:
        log.info("Downloading linguistic resources: %r...", task)
        downloader.download('TASK:%s' % task, quiet=True)


def analyze_documents(collection_id):
    query = {'term': {'collection_id': collection_id}}
    query = {'query': query, '_source': False}
    for row in scan_iter(query, TYPE_DOCUMENT):
        analyze_document_id.delay(row.get('_id'))


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
    log.info("Analyze document: %r", document)
    start = timer()

    # initialise the analyzers
    analyzers = []
    for cls in get_analyzers():
        analyzer = cls(document)
        analyzer.prepare()
        analyzers.append(analyzer)

    # run the analyzers on each fragment of text in the given
    # document (row cells or text pages).
    for text in document.text_parts():
        for analyzer in analyzers:
            if not analyzer.disabled:
                analyzer.on_text(text)

    # collect outputs.
    for analyzer in analyzers:
        if not analyzer.disabled:
            analyzer.finalize()
    db.session.add(document)
    db.session.commit()

    end = timer()
    log.info("Completed analysis: %r (elapsed: %.2fms)", document, end - start)

    # next: update the search index.
    index_document(document)
    index_records(document)
