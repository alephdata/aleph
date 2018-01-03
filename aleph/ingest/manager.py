import os
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
        from aleph.logic.documents import process_document
        result.update()
        db.session.commit()
        document = result.document
        log.debug('Ingested [%s:%s]: %s',
                  document.id, document.schema, document.title)
        process_document(document)

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
        ingest_document(doc, file_path, role_id=parent.role_id)
        return DocumentResult(self, doc,
                              file_path=file_path,
                              role_id=parent.role_id)

    def ingest_document(self, document, file_path=None, role_id=None):
        """Ingest a database-backed document.

        First retrieve its data and then call the actual ingestor.
        """
        content_hash = document.content_hash
        if file_path is None and content_hash is not None:
            file_path = self.archive.load_file(content_hash, file_name=document.safe_file_name)  # noqa

        if file_path is not None and not os.path.exists(file_path):
            # Probably indicative of file system encoding issues.
            log.error("Ingest invalid path [%r]: %s",
                      document, file_path)
            return

        try:
            if document.collection is not None:
                if not len(document.languages):
                    document.languages = document.collection.languages

                if not len(document.countries):
                    document.countries = document.collection.countries

            result = DocumentResult(self, document,
                                    file_path=file_path,
                                    role_id=role_id)
            self.ingest(file_path, result=result)

            if file_path is None:
                # When a directory is ingested, the data is not stored. Thus,
                # try to recurse transparently.
                for child in Document.by_parent(document):
                    self.ingest_document(child, role_id=role_id)
        finally:
            db.session.rollback()
            if content_hash is not None:
                self.archive.cleanup_file(content_hash)
