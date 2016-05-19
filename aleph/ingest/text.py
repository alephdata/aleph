import logging

from aleph.core import get_archive, get_config
from aleph.model import db, Document, DocumentPage
from aleph.ingest.pdf import extract_pdf
from aleph.ingest.ingestor import Ingestor

log = logging.getLogger(__name__)


class TextIngestor(Ingestor):
    DOCUMENT_TYPE = Document.TYPE_TEXT

    def create_document(self, meta, type=None):
        document = super(TextIngestor, self).create_document(meta, type=type)
        document.delete_pages()
        return document

    def create_page(self, document, text, number=1):
        page = DocumentPage()
        page.document_id = document.id
        page.text = text
        page.number = number
        db.session.add(page)
        return page

    def get_languages(self, meta):
        default_languages = get_config('OCR_DEFAULTS', ['en'])
        languages = meta.languages + default_languages
        return list(set(languages))

    def extract_pdf(self, meta, pdf_path):
        data = extract_pdf(pdf_path, languages=self.get_languages(meta))
        if data is None:
            log.error("Could not parse PDF: %r", meta)
            return

        if not meta.has('author') and data.get('author'):
            meta['author'] = data.get('author')

        if not meta.has('title') and data.get('title'):
            meta.title = data.get('title')

        document = self.create_document(meta)
        for i, page in enumerate(data['pages']):
            self.create_page(document, page, number=i + 1)
        self.emit(document)

    def store_pdf(self, meta, pdf_path):
        get_archive().archive_file(pdf_path, meta.pdf, move=False)


class PDFIngestor(TextIngestor):
    MIME_TYPES = ['application/pdf']
    EXTENSIONS = ['pdf']

    def ingest(self, meta, local_path):
        try:
            self.extract_pdf(meta, local_path)
        except Exception as exception:
            self.log_exception(meta, exception)

    @classmethod
    def match(cls, meta, local_path):
        with open(local_path, 'r') as fh:
            if fh.read(10).startswith('%PDF-1.'):
                return 15
        return -1
