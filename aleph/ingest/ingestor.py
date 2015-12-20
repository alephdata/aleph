import logging

from aleph.core import db
from aleph.analyze import analyze_document

log = logging.getLogger(__name__)


class Ingestor(object):

    def __init__(self, source_id):
        self.source_id = source_id

    def ingest(self, meta):
        raise NotImplemented()

    def create_document(self, meta):
        pass

    def emit(self, document):
        db.session.commit()
        log.debug("Ingested document: %r", document)
        analyze_document.delay(document.id)

    @classmethod
    def match(cls, meta):
        return -1

    @classmethod
    def dispatch(cls, source_id, meta):
        print "FUUUUUU", meta.to_dict()
