import logging

from ingestors import Manager
from ingestors.util import decode_path

from aleph.core import db, settings
from aleph.model import Document, Cache
from aleph.ingest.result import DocumentResult

log = logging.getLogger(__name__)


class DocumentManager(Manager):
    """Handle the process of ingesting documents.

    This includes creating and flushing records, setting document state and
    dispatching child ingestors as needed.
    """

    RESULT_CLASS = DocumentResult

    def __init__(self, archive):
        super(DocumentManager, self).__init__({
            'PDF_OCR_PAGES': True,
            'OCR_DEFAULTS': settings.OCR_DEFAULTS
        })
        self.archive = archive

    def before(self, result):
        db.session.flush()
        result.document.status = Document.STATUS_PENDING
        result.document.delete_records()

    def after(self, result):
        result.update()

    def get_cache(self, key):
        return Cache.get_cache(key)

    def set_cache(self, key, value):
        Cache.set_cache(key, value)

    def handle_child(self, parent, file_path, title=None, mime_type=None,
                     id=None, file_name=None):
        file_path = decode_path(file_path)
        assert id is not None, (parent, file_path)

        doc = Document.by_keys(parent_id=parent.document.id,
                               collection=parent.document.collection,
                               foreign_id=id)
        doc.title = title or doc.meta.get('title')
        doc.file_name = file_name or doc.meta.get('file_name')
        doc.mime_type = mime_type or doc.meta.get('mime_type')

        from aleph.ingest import ingest_document
        ingest_document(doc, file_path, role_id=parent.document.uploader_id)
        return DocumentResult(self, doc, file_path=file_path)
