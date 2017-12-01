import logging
from collections import OrderedDict
from ingestors import Result
from normality import stringify
from followthemoney import model

from aleph.core import db
from aleph.model import Document, DocumentRecord
from aleph.model import DocumentTag, DocumentTagCollector

log = logging.getLogger(__name__)


class DocumentResult(Result):
    """Wrapper to link a Document to an ingestor result object."""

    SCHEMATA = {
        Result.FLAG_DIRECTORY: 'Folder',
        Result.FLAG_PLAINTEXT: 'PlainText',
        Result.FLAG_PACKAGE: 'Package',
        Result.FLAG_PDF: 'Pages',
        Result.FLAG_HTML: 'HyperText',
        Result.FLAG_WORKBOOK: 'Workbook',
        Result.FLAG_IMAGE: 'Image',
        Result.FLAG_TABULAR: 'Table',
        Result.FLAG_EMAIL: 'Email',
    }

    def __init__(self, manager, document, file_path=None, role_id=None):
        document.pdf_version = None
        self.manager = manager
        self.role_id = role_id
        self.document = document
        self.columns = OrderedDict()
        self.pages = []
        bind = super(DocumentResult, self)
        bind.__init__(id=document.foreign_id,
                      checksum=document.content_hash,
                      file_path=file_path,
                      file_name=document.meta.get('file_name'),
                      mime_type=document.meta.get('mime_type'),
                      encoding=document.meta.get('encoding'),
                      languages=document.meta.get('languages', []),
                      size=document.file_size)

    def emit_html_body(self, html, text):
        self.document.body_raw = html
        self.document.body_text = stringify(text)

    def emit_text_body(self, text):
        self.document.body_text = stringify(text)

    def emit_page(self, index, text):
        """Emit a plain text page."""
        text = stringify(text)
        record = DocumentRecord()
        record.document_id = self.document.id
        record.text = text
        record.index = index
        db.session.add(record)
        if text is not None:
            self.pages.append(text)

    def _emit_iterator_rows(self, iterator):
        for row in iterator:
            for column in row.keys():
                self.columns[column] = None
            yield row

    def emit_rows(self, iterator):
        """Emit rows of a tabular iterator."""
        self.document.insert_records(0, self._emit_iterator_rows(iterator))

    def emit_pdf_alternative(self, file_path):
        content_hash = self.manager.archive.archive_file(file_path)
        self.document.pdf_version = content_hash

    def update(self):
        """Apply the outcome of the result to the document."""
        doc = self.document
        if self.status == self.STATUS_SUCCESS:
            doc.status = Document.STATUS_SUCCESS
            doc.error_message = None
        else:
            doc.status = Document.STATUS_FAIL
            doc.error_message = stringify(self.error_message)

        schema = model['Document']
        for flag, name in self.SCHEMATA.items():
            if flag in self.flags:
                schema = model[name]

        doc.schema = schema.name
        doc.foreign_id = stringify(self.id)
        doc.content_hash = self.checksum or doc.content_hash
        doc.uploader_id = self.role_id or doc.uploader_id
        doc.title = stringify(self.title) or doc.meta.get('title')
        doc.summary = stringify(self.summary) or doc.meta.get('summary')
        doc.author = stringify(self.author) or doc.meta.get('author')
        doc.generator = stringify(self.generator) or doc.meta.get('generator')
        doc.mime_type = stringify(self.mime_type) or doc.meta.get('mime_type')
        doc.encoding = stringify(self.encoding) or doc.meta.get('encoding')

        doc.date = self.date or doc.meta.get('date')
        doc.authored_at = self.created_at or doc.meta.get('authored_at')
        doc.modified_at = self.modified_at or doc.meta.get('modified_at')
        doc.published_at = self.published_at or doc.meta.get('published_at')

        for kw in self.keywords:
            doc.add_keyword(kw)
        for lang in self.languages:
            doc.add_language(lang)

        doc.headers = self.headers or doc.meta.get('headers')
        doc.columns = self.columns.keys()

        if len(self.pages):
            doc.body_text = '\n\n'.join(self.pages)

        collector = DocumentTagCollector(doc, 'ingestors')
        for entity in self.entities:
            collector.emit(entity, DocumentTag.TYPE_PERSON)
        for email in self.emails:
            collector.emit(email, DocumentTag.TYPE_EMAIL)
        collector.save()
