import logging
from collections import OrderedDict
from ingestors import Result
from normality import stringify

from aleph.core import db
from aleph.model import Document, DocumentRecord
from aleph.model import DocumentTag, DocumentTagCollector

log = logging.getLogger(__name__)


class DocumentResult(Result):
    """Wrapper to link a Document to an ingestor result object."""

    def __init__(self, manager, document, file_path=None, user_queue=False):
        self.manager = manager
        self.user_queue = user_queue
        self.document = document
        self.pdf_hash = document.pdf_version
        self.columns = OrderedDict()
        bind = super(DocumentResult, self)
        bind.__init__(id=document.foreign_id,
                      checksum=document.content_hash,
                      file_path=file_path,
                      title=document.meta.get('title'),
                      summary=document.meta.get('summary'),
                      author=document.meta.get('author'),
                      keywords=document.meta.get('keywords', []),
                      file_name=document.meta.get('file_name'),
                      mime_type=document.meta.get('mime_type'),
                      encoding=document.meta.get('encoding'),
                      languages=document.meta.get('languages', []),
                      headers=document.meta.get('headers'),
                      size=document.meta.get('file_size'))

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
            for column in row.keys():
                self.columns[column] = None
            yield row

    def emit_rows(self, iterator):
        """Emit rows of a tabular iterator."""
        # TODO: also generate a tabular rep for the metadata
        self.document.type = Document.TYPE_TABULAR
        self.document.insert_records(0, self._emit_iterator_rows(iterator))

    def emit_pdf_alternative(self, file_path):
        self.pdf_hash = self.manager.archive.archive_file(file_path)

    def update(self):
        """Apply the outcome of the result to the document."""
        if self.status == self.STATUS_SUCCESS:
            self.document.status = Document.STATUS_SUCCESS
            self.document.error_message = None
        else:
            self.document.status = Document.STATUS_FAIL
            self.document.type = Document.TYPE_OTHER
            self.document.error_message = self.error_message
        self.document.foreign_id = stringify(self.id)
        if self.checksum:
            self.document.content_hash = self.checksum
        self.document.file_size = self.size
        self.document.file_name = self.file_name
        self.document.title = stringify(self.title)
        self.document.summary = stringify(self.summary)
        self.document.author = stringify(self.author)
        self.document.keywords = self.keywords
        self.document.mime_type = stringify(self.mime_type)
        self.document.encoding = self.encoding
        self.document.languages = self.languages
        self.document.headers = self.headers
        self.document.pdf_version = self.pdf_hash
        self.document.columns = self.columns.keys()

        collector = DocumentTagCollector(self.document, 'ingestors')
        for entity in self.entities:
            collector.emit(entity, DocumentTag.TYPE_PERSON)
        for email in self.emails:
            collector.emit(email, DocumentTag.TYPE_EMAIL)
        collector.save()
