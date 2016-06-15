import sys
import logging
import traceback
from sqlalchemy.exc import SQLAlchemyError

from aleph.core import db, get_archive
from aleph.ext import get_ingestors
from aleph.model import Document, Collection, CrawlerState
from aleph.analyze import analyze_document

log = logging.getLogger(__name__)


class IngestorException(Exception):
    pass


class Ingestor(object):
    DOCUMENT_TYPE = Document.TYPE_OTHER
    MIME_TYPES = []
    EXTENSIONS = []
    BASE_SCORE = 5

    def __init__(self, collection_id):
        self.collection_id = collection_id

    def ingest(self, meta, local_path):
        raise NotImplemented()

    def create_document(self, meta, type=None):
        if meta.content_hash:
            q = Document.all()
            if meta.foreign_id:
                q = q.filter(Document.foreign_id == meta.foreign_id)
            else:
                q = q.filter(Document.content_hash == meta.content_hash)
            clause = Collection.id == self.collection_id
            q = q.filter(Document.collections.any(clause))
            document = q.first()
        if document is None:
            document = Document()
            document.collections = [Collection.by_id(self.collection_id)]
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
    def handle_exception(cls, meta, collection_id, exception):
        db.session.rollback()
        db.session.close()
        if isinstance(exception, SQLAlchemyError):
            log.exception(exception)
            return
        (error_type, error_message, error_details) = sys.exc_info()
        if error_type is not None:
            error_message = unicode(error_message)
            error_details = traceback.format_exc()
        else:
            error_message = unicode(exception)
        error_type = exception.__class__.__name__
        log.warning(error_message)
        CrawlerState.store_fail(meta, collection_id,
                                error_type=error_type,
                                error_message=error_message,
                                error_details=error_details)
        db.session.commit()

    @classmethod
    def match(cls, meta, local_path):
        score = -1
        if meta.mime_type in cls.MIME_TYPES:
            score += cls.BASE_SCORE
        if meta.extension in cls.EXTENSIONS:
            score += cls.BASE_SCORE
        return score

    @classmethod
    def auction_file(cls, meta, local_path):
        best_score, best_cls = 0, None
        for cls in get_ingestors().values():
            score = cls.match(meta, local_path)
            if score > best_score:
                best_score = score
                best_cls = cls
        if best_cls is None:
            raise IngestorException("No ingestor found: %r (%s, %s)" %
                                    (meta.file_name, meta.extension,
                                     meta.mime_type))
        return best_cls

    @classmethod
    def dispatch(cls, collection_id, meta):
        local_path = get_archive().load_file(meta)
        try:
            best_cls = cls.auction_file(meta, local_path)
            log.debug("Dispatching %r to %r", meta.file_name, best_cls)
            best_cls(collection_id).ingest(meta, local_path)
            CrawlerState.store_ok(meta, collection_id)
            db.session.commit()
        except Exception as exception:
            cls.handle_exception(meta, collection_id, exception)
        finally:
            get_archive().cleanup_file(meta)
