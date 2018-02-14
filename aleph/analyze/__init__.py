from __future__ import absolute_import

import logging
from polyglot.downloader import downloader

from aleph.core import db
from aleph.ext import get_analyzers


log = logging.getLogger(__name__)


def install_analyzers():
    """Download linguistic resources for the analyzers."""
    for task in ['embeddings2', 'ner2']:
        log.info("Downloading linguistic resources: %r...", task)
        downloader.download('TASK:%s' % task, quiet=True)


def analyze_document(document):
    """Run analyzers (such as NER) on a given document."""
    log.info("Analyze document [%s]: %s", document.id, document.title)

    for cls in get_analyzers():
        analyzer = cls()
        if analyzer.active:
            analyzer.analyze(document)

    db.session.add(document)
    db.session.commit()
