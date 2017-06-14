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
    """Handle the process of ingesting documents.

    This includes creating and flushing records, setting document state and
    dispatching child ingestors as needed.
    """

    RESULT_CLASS = DocumentResult

    def __init__(self, config, archive):
        super(DocumentManager, self).__init__(config)
        self.archive = archive

    def before(self, result):
        db.session.flush()
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
                     id=None, file_name=None):
        file_path = decode_path(file_path)
        file_name = decode_path(file_name) or os.path.basename(file_path)

        content_hash = None
        if not os.path.isdir(file_path):
            content_hash = checksum(file_path)

        document = Document.by_keys(parent_id=parent.document.id,
                                    collection=parent.document.collection,
                                    foreign_id=id, content_hash=content_hash)
        document.title = title or document.meta.get('title')
        document.file_name = file_name or document.meta.get('file_name')
        document.mime_type = mime_type or document.meta.get('mime_type')

        from aleph.ingest import ingest_document
        ingest_document(document, file_path, user_queue=parent.user_queue)

    def ingest_document(self, document, file_path=None, user_queue=False):
        """Ingest a database-backed document.

        First retrieve it's data and then call the actual ingestor.
        """
        if file_path is None:
            file_path = self.archive.load_file(document.content_hash,
                                               file_name=document.file_name)

        if file_path is None:
            # TODO: save this to the document?
            log.error("Cannot load data: %r", document)
            return

        try:
            if not len(document.languages) and document.collection is not None:
                document.languages = document.collection.languages or []

            if not len(document.countries) and document.collection is not None:
                document.countries = document.collection.countries or []

            result = DocumentResult(self, document,
                                    file_path=file_path,
                                    user_queue=user_queue)
            self.ingest(file_path, result=result)
        finally:
            self.archive.cleanup_file(document.content_hash)
