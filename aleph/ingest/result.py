import logging

from ingestors import Result
from normality import stringify

from aleph.core import db
from aleph.model import Document, DocumentRecord

log = logging.getLogger(__name__)


class DocumentResult(Result):
    """Wrapper to link a Document to an ingestor result object."""

    def __init__(self, manager, document, file_path=None):
        self.manager = manager
        self.document = document
        meta = document.meta
        self.pdf_hash = meta.pdf_version
        file_path = file_path or meta.source_path
        super(DocumentResult, self).__init__(id=meta._foreign_id,
                                             checksum=document.content_hash,
                                             title=meta._title,
                                             summary=meta.summary,
                                             author=meta.author,
                                             keywords=meta.keywords,
                                             file_path=file_path,
                                             file_name=meta._file_name,
                                             mime_type=meta._mime_type,
                                             encoding=meta.encoding,
                                             languages=meta.languages,
                                             headers=meta._headers,
                                             size=meta.file_size)

    def emit_page(self, index, text):
        """Emit a plain text page."""
        self.document.type = Document.TYPE_TEXT
        record = DocumentRecord()
        record.document_id = self.document.id
        record.text = text
        record.index = index
        db.session.add(record)

    def _emit_iterator_rows(self, iterator):
        for row in iterator:
            yield row

    def emit_rows(self, iterator):
        """Emit rows of a tabular iterator."""
        # TODO: also generate a tabular rep for the metadata
        self.document.type = Document.TYPE_TABULAR
        self.document.insert_records(0, self._emit_iterator_rows(iterator))

    def update(self):
        """Apply the outcome of the result to the document."""
        if self.status == self.STATUS_SUCCESS:
            self.document.status = Document.STATUS_SUCCESS
            self.document.error_message = None
        else:
            self.document.status = Document.STATUS_FAIL
            self.document.type = Document.TYPE_OTHER
            self.document.error_message = self.error_message
        meta = self.document.meta
        meta.foreign_id = stringify(self.id)
        if self.checksum:
            meta.content_hash = self.checksum
        meta.file_size = self.size
        meta.title = stringify(self.title)
        meta.summary = stringify(self.summary)
        meta.author = stringify(self.author)
        meta.keywords = self.keywords
        meta.source_path = stringify(self.file_path)
        meta.mime_type = stringify(self.mime_type)
        meta.encoding = self.encoding
        meta.languages = self.languages
        meta.headers = self.headers
        meta.pdf_version = self.pdf_hash
        self.document.meta = meta

    def emit_pdf_alternative(self, file_path):
        self.pdf_hash = self.manager.archive.archive_file(file_path)
