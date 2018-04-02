from __future__ import absolute_import

import logging
from polyglot.downloader import downloader

from aleph.core import db
from aleph.util import get_extensions


log = logging.getLogger(__name__)


def install_analyzers():
    """Download linguistic resources for the analyzers."""
    for task in ['embeddings2', 'ner2']:
        log.info("Downloading linguistic resources: %r...", task)
        downloader.download('TASK:%s' % task, quiet=True)


def analyze_document(document):
    """Run analyzers (such as NER) on a given document."""
    log.info("Analyze document [%s]: %s", document.id, document.title)
    analyzers = get_extensions('aleph.analyzers')
    analyzers = sorted(analyzers, key=lambda a: a.PRIORITY, reverse=True)

    for cls in analyzers:
        print ('Load ' + str(cls))
        analyzer = cls()
        if not analyzer.active:
            continue
        try:
            analyzer.analyze(document)
        except Exception:
            log.exception("Analyzer %s failed.", cls)

    db.session.add(document)
    db.session.commit()
