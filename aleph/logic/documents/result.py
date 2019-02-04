import logging
from banal import ensure_list
from collections import OrderedDict
from normality import stringify
from followthemoney import model
from ingestors import Result
from ingestors.util import safe_string

from aleph.core import db, archive
from aleph.model import Document, DocumentRecord
from aleph.model import DocumentTag, DocumentTagCollector

log = logging.getLogger(__name__)


class DocumentResult(Result):
    """Wrapper to link a Document to an ingestor result object."""

    SCHEMATA = (
        (Result.FLAG_DIRECTORY, Document.SCHEMA_FOLDER),
        (Result.FLAG_PLAINTEXT, Document.SCHEMA_TEXT),
        (Result.FLAG_PACKAGE, Document.SCHEMA_PACKAGE),
        (Result.FLAG_PDF, Document.SCHEMA_PDF),
        (Result.FLAG_HTML, Document.SCHEMA_HTML),
        (Result.FLAG_WORKBOOK, Document.SCHEMA_WORKBOOK),
        (Result.FLAG_IMAGE, Document.SCHEMA_IMAGE),
        (Result.FLAG_VIDEO, Document.SCHEMA_VIDEO),
        (Result.FLAG_AUDIO, Document.SCHEMA_AUDIO),
        (Result.FLAG_TABULAR, Document.SCHEMA_TABLE),
        (Result.FLAG_EMAIL, Document.SCHEMA_EMAIL),
    )

    def __init__(self, manager, document, file_path=None):
        self.manager = manager
        self.document = document
        self.columns = OrderedDict()
        self.pages = []
        ocr_languages = set(document.languages)
        if document.collection.languages is not None:
            ocr_languages.update(document.collection.languages)
        bind = super(DocumentResult, self)
        bind.__init__(id=document.foreign_id,
                      checksum=document.content_hash,
                      file_path=file_path,
                      file_name=document.meta.get('file_name'),
                      mime_type=document.meta.get('mime_type'),
                      title=document.meta.get('title'),
                      summary=document.meta.get('summary'),
                      author=document.meta.get('author'),
                      generator=document.meta.get('generator'),
                      date=document.meta.get('date'),
                      authored_at=document.meta.get('authored_at'),
                      modified_at=document.meta.get('modified_at'),
                      published_at=document.meta.get('published_at'),
                      encoding=document.meta.get('encoding'),
                      languages=document.meta.get('languages', []),
                      message_id=document.meta.get('message_id'),
                      in_reply_to=document.meta.get('in_reply_to', []),
                      ocr_languages=ocr_languages,
                      size=document.file_size)

    def emit_page(self, index, text):
        """Emit a plain text page."""
        record = DocumentRecord()
        record.document_id = self.document.id
        record.text = safe_string(text)
        record.index = index
        db.session.add(record)

    def _emit_iterator_rows(self, iterator):
        for data in iterator:
            for column in data.keys():
                column = safe_string(column)
                self.columns[column] = None
            yield data

    def emit_rows(self, iterator):
        """Emit rows of a tabular iterator."""
        iterator = self._emit_iterator_rows(iterator)
        DocumentRecord.insert_records(self.document.id, iterator)

    def emit_pdf_alternative(self, file_path):
        content_hash = archive.archive_file(file_path)
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
        for flag, name in self.SCHEMATA:
            if flag in self.flags:
                schema = model[name]

        doc.schema = schema.name
        doc.foreign_id = safe_string(self.id)
        doc.content_hash = self.checksum or doc.content_hash
        doc.title = self.title or doc.meta.get('title')
        doc.file_name = self.file_name or doc.meta.get('file_name')
        doc.file_size = self.size or doc.meta.get('file_size')
        doc.summary = self.summary or doc.meta.get('summary')
        doc.author = self.author or doc.meta.get('author')
        doc.generator = self.generator or doc.meta.get('generator')
        doc.mime_type = self.mime_type or doc.meta.get('mime_type')
        doc.encoding = self.encoding or doc.meta.get('encoding')
        doc.date = self.date or doc.meta.get('date')
        doc.authored_at = self.created_at or doc.meta.get('authored_at')
        doc.modified_at = self.modified_at or doc.meta.get('modified_at')
        doc.published_at = self.published_at or doc.meta.get('published_at')
        doc.message_id = self.message_id or doc.meta.get('message_id')
        doc.in_reply_to = ensure_list(self.in_reply_to)
        doc.columns = list(self.columns.keys())
        doc.body_raw = self.body_html
        doc.body_text = self.body_text

        for kw in self.keywords:
            doc.add_keyword(safe_string(kw))
        for lang in self.languages:
            doc.add_language(safe_string(lang))

        db.session.flush()

        collector = DocumentTagCollector(doc, 'ingestors')
        for entity in self.entities:
            collector.emit(entity, DocumentTag.TYPE_PERSON)
        for email in self.emails:
            collector.emit(email, DocumentTag.TYPE_EMAIL)
        collector.save()
