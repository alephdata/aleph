import logging

from aleph.core import db
from aleph.model import Document
from aleph.util import get_extensions

log = logging.getLogger(__name__)
ANALYZERS = []


def get_analyzers():
    if not len(ANALYZERS):
        analyzers = get_extensions('aleph.analyzers')
        analyzers = sorted(analyzers, key=lambda a: a.PRIORITY, reverse=True)
        for cls in analyzers:
            analyzer = cls()
            if not analyzer.active:
                continue
            ANALYZERS.append(analyzer)
    return ANALYZERS


def analyze_document(document):
    """Run analyzers (such as NER) on a given document."""
    if document.status != Document.STATUS_SUCCESS:
        return
    log.info("Analyze document [%s]: %s", document.id, document.name)

    for analyzer in get_analyzers():
        try:
            analyzer.analyze(document)
        except Exception:
            log.exception("Analyzer %r failed.", analyzer)

    db.session.add(document)
    db.session.commit()
