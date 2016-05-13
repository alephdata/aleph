import os
import logging

from aleph.core import get_archive, get_config
from aleph.model import db, Document, DocumentPage
from aleph.extractors import extract_pdf
from aleph.extractors import document_to_pdf
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


class DocumentIngestor(TextIngestor):
    MIME_TYPES = ['application/msword', 'application/rtf', 'application/x-rtf',
                  'application/vnd.oasis.opendocument.text',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # noqa
                  'text/richtext', 'application/wordperfect', 'application/vnd.wordperfect']  # noqa
    EXTENSIONS = ['doc', 'docx', 'rtf', 'odt', 'sxw', 'dot', 'docm', 'hqx',
                  'pdb', 'txt', 'wpd']
    BASE_SCORE = 5

    def extract_pdf_alternative(self, meta, pdf_path):
        try:
            self.store_pdf(meta, pdf_path)
            self.extract_pdf(meta, pdf_path)
        except Exception as exception:
            self.log_exception(meta, exception)
        finally:
            if pdf_path is not None and os.path.isfile(pdf_path):
                os.unlink(pdf_path)

    def ingest(self, meta, local_path):
        pdf_path = document_to_pdf(local_path)
        if pdf_path is None or not os.path.isfile(pdf_path):
            log.error("Could not convert document: %r", meta)
            return
        self.extract_pdf_alternative(meta, pdf_path)


class PresentationIngestor(DocumentIngestor):
    MIME_TYPES = ['application/vnd.ms-powerpoint.presentation',
                  'application/vnd.ms-powerpoint',
                  'application/vnd.openxmlformats-officedocument.presentationml.presentation',  # noqa
                  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',  # noqa
                  'application/vnd.oasis.opendocument.presentation',
                  'application/vnd.sun.xml.impress']
    EXTENSIONS = ['ppt', 'pptx', 'odp', 'pot', 'pps', 'ppa']
    BASE_SCORE = 5
