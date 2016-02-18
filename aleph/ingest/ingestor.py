import logging

from aleph.core import db, archive
from aleph.ext import get_ingestors
from aleph.model import Document
from aleph.analyze import analyze_document

log = logging.getLogger(__name__)


class Ingestor(object):
    DOCUMENT_TYPE = Document.TYPE_OTHER
    MIME_TYPES = []
    EXTENSIONS = []
    BASE_SCORE = 5

    def __init__(self, source_id):
        self.source_id = source_id

    def ingest(self, meta, local_path):
        raise NotImplemented()

    def create_document(self, meta, type=None):
        if meta.content_hash:
            q = db.session.query(Document)
            if meta.foreign_id:
                q = q.filter(Document.foreign_id == meta.foreign_id)
            else:
                q = q.filter(Document.content_hash == meta.content_hash)
            q = q.filter(Document.source_id == self.source_id)
            document = q.first()
        if document is None:
            document = Document()
            document.source_id = self.source_id
        document.meta = meta
        document.type = type or self.DOCUMENT_TYPE
        db.session.add(document)
        db.session.flush()
        return document

    def emit(self, document):
        db.session.commit()
        log.debug("Ingested document: %r", document)
        analyze_document(document.id)

    @classmethod
    def match(cls, meta, local_path):
        score = -1
        if meta.mime_type in cls.MIME_TYPES:
            score += cls.BASE_SCORE
        if meta.extension in cls.EXTENSIONS:
            score += cls.BASE_SCORE
        return score

    @classmethod
    def dispatch(cls, source_id, meta):
        best_score, best_cls = 0, None
        local_path = archive.load_file(meta)
        try:
            for cls in get_ingestors().values():
                score = cls.match(meta, local_path)
                if score > best_score:
                    best_score = score
                    best_cls = cls
            if best_cls is None:
                log.debug("No ingestor found for: %r", meta.file_name)
                return
            log.debug("Dispatching %r to %r", meta.file_name,
                      best_cls.__name__)
            best_cls(source_id).ingest(meta, local_path)
        finally:
            archive.cleanup_file(meta)
            # db.session.dispose()
