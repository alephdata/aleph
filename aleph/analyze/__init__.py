import logging

from aleph.core import db
from aleph.util import get_extensions


log = logging.getLogger(__name__)


def analyze_document(document):
    """Run analyzers (such as NER) on a given document."""
    log.info("Analyze document [%s]: %s", document.id, document.title)
    analyzers = get_extensions('aleph.analyzers')
    analyzers = sorted(analyzers, key=lambda a: a.PRIORITY, reverse=True)

    for cls in analyzers:
        analyzer = cls()
        if not analyzer.active:
            continue
        try:
            analyzer.analyze(document)
        except Exception:
            log.exception("Analyzer %s failed.", cls)

    db.session.add(document)
    db.session.commit()
