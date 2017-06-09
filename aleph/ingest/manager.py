import os
import logging

from ingestors import Manager
from ingestors.util import decode_path

from aleph.core import db
from aleph.model import Document
from aleph.analyze import analyze_document
from aleph.ingest.result import DocumentResult
from aleph.util import checksum

log = logging.getLogger(__name__)


class DocumentManager(Manager):

    RESULT_CLASS = DocumentResult

    def __init__(self, config, archive):
        super(DocumentManager, self).__init__(config)
        self.archive = archive

    def before(self, result):
        result.document.status = Document.STATUS_PENDING
        result.document.delete_records()

    def after(self, result):
        result.update()
        db.session.commit()
        if result.error_message:
            log.warn('Error [%r]: %s', result, result.error_message)
        else:
            log.debug('Ingested: %r', result.document)
        analyze_document(result.document)

    def locate_document(self, parent=None, collection_id=None, foreign_id=None,
                        content_hash=None):
        """Try and find a document by various criteria."""
        q = Document.all()
        collection_id = parent.collection_id if parent else collection_id
        assert collection_id, (parent, collection_id)
        q = q.filter(Document.collection_id == collection_id)

        if parent is not None:
            q = q.filter(Document.parent_id == parent.id)

        if foreign_id is not None:
            q = q.filter(Document.foreign_id == foreign_id)
        elif content_hash is not None:
            q = q.filter(Document.content_hash == content_hash)
        else:
            raise ValueError("No unique criterion for document.")

        document = q.first()
        if document is None:
            document = Document()
            document.collection_id = collection_id
            if parent is not None:
                document.parent_id = parent.id
            document.foreign_id = foreign_id
            document.content_hash = content_hash
            document.status = document.STATUS_PENDING
            db.session.add(document)
        return document

    def handle_child(self, parent, file_path, title=None, mime_type=None,
                     id=None, collection_id=None, meta=None):
        foreign_id = id or os.path.basename(decode_path(file_path))
        content_hash = None
        if not os.path.isdir(file_path):
            content_hash = checksum(file_path)

        parent_doc = parent.document if parent else None
        document = self.locate_document(parent=parent_doc,
                                        collection_id=collection_id,
                                        foreign_id=foreign_id,
                                        content_hash=content_hash)
        meta = meta or document.meta
        meta.foreign_id = meta.foreign_id or foreign_id
        meta.content_hash = content_hash
        meta.title = title or meta.title
        meta.mime_type = mime_type or meta.mime_type
        meta.source_path = file_path or meta.source_path
        document.meta = meta
        db.session.commit()

        if os.path.isdir(file_path):
            self.ingest_document(document, file_path=file_path)
        else:
            from aleph.ingest import ingest
            ingest.delay(document.id)

    def ingest_document(self, document, file_path=None):
        """Ingest a database-backed document.

        First retrieve it's data and then call the actual ingestor.
        """
        if file_path is None:
            file_name = document.meta.file_name
            file_path = self.archive.load_file(document.content_hash,
                                               file_name=file_name)

        if file_path is None:
            # TODO: save this to the document?
            log.error("Cannot load data: %r", document)
            return

        try:
            result = DocumentResult(self, document)
            self.ingest(file_path, result=result)
        finally:
            self.cleanup_file(document.content_hash)
