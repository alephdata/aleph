import logging

from ingestors import Result
from ingestors import Manager
from normality import stringify

from aleph.core import db
from aleph.model import Document, DocumentRecord
from aleph.analyze import analyze_document

log = logging.getLogger(__name__)


class DocumentManager(Manager):

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

    def handle_child(self, parent, file_path, file_name=None, mime_type=None):
        # result = self.RESULT_CLASS(file_path=file_path, **kwargs)
        # parent.children.append(result)
        # self.ingest(file_path, result=result)
        pass


class DocumentResult(Result):

    def __init__(self, manager, document, file_path=None):
        self.manager = manager
        self.document = document
        meta = document.meta
        self.pdf_hash = meta.pdf_version
        file_path = file_path or meta.source_path
        super(DocumentResult, self).__init__(id=document.foreign_id,
                                             checksum=document.content_hash,
                                             title=meta.title,
                                             summary=meta.summary,
                                             author=meta.author,
                                             keywords=meta.keywords,
                                             file_path=file_path,
                                             file_name=meta.file_name,
                                             mime_type=meta.mime_type,
                                             encoding=meta.encoding,
                                             languages=meta.languages,
                                             headers=meta.headers,
                                             size=int(meta.file_size))

    def emit_page(self, index, text):
        self.document.type = Document.TYPE_TEXT
        record = DocumentRecord()
        record.document_id = self.document.id
        record.text = text
        record.index = index
        db.session.add(record)

    def _emit_row_records(self, iterator):
        for index, row in enumerate(iterator):
            yield {
                'sheet': 0,
                'index': index,
                'data': row
            }

    def emit_rows(self, iterator):
        self.document.type = Document.TYPE_TABULAR
        iterator = self._emit_row_records(iterator)
        self.document.insert_records(0, iterator)

    def update(self):
        if self.status == self.STATUS_SUCCESS:
            self.document.status = Document.STATUS_SUCCESS
            self.document.error_message = None
        else:
            self.document.status = Document.STATUS_FAIL
            self.document.type = Document.TYPE_OTHER
            self.document.error_message = self.error_message
        meta = self.document.meta
        meta.foreign_id = stringify(self.id)
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
