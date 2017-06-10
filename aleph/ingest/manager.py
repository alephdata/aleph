import os
import logging

from ingestors import Manager
from ingestors.util import decode_path

from aleph.core import db
from aleph.model import Document, Cache
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

    def get_cache(self, key):
        return Cache.get_cache(key)

    def set_cache(self, key, value):
        Cache.set_cache(key, value)

    def handle_child(self, parent, file_path, title=None, mime_type=None,
                     id=None, collection_id=None, meta=None, file_name=None):
        file_path = decode_path(file_path)
        file_name = decode_path(file_name) or os.path.basename(file_path)
        id = id or meta.foreign_id
        content_hash = None
        if not os.path.isdir(file_path):
            content_hash = checksum(file_path)

        parent_id = None
        if parent is not None:
            parent_id = parent.document.id
            collection_id = parent.document.collection_id

        document = Document.by_keys(parent_id=parent_id,
                                    collection_id=collection_id,
                                    foreign_id=id,
                                    content_hash=content_hash)
        meta = meta or document.meta
        meta.foreign_id = meta.foreign_id or id
        meta.content_hash = content_hash
        meta.title = title or meta._title
        meta.file_name = file_name or meta._file_name
        meta.mime_type = mime_type or meta._mime_type
        meta.source_path = file_path or meta.source_path
        document.meta = meta
        db.session.commit()

        if os.path.isdir(file_path):
            self.ingest_document(document, file_path=file_path)
        else:
            self.archive.archive_file(file_path, content_hash=content_hash)
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
            self.archive.cleanup_file(document.content_hash)
