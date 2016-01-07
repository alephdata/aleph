import os
import logging
from lxml import html

from aleph.model import db, Page, Document
from aleph.ingest.ingestor import Ingestor
from aleph.ingest.ocr import extract_pdf, document_to_pdf, extract_image
from aleph.util import guess_encoding

log = logging.getLogger(__name__)


class TextIngestor(Ingestor):
    DOCUMENT_TYPE = Document.TYPE_TEXT

    def create_document(self, meta, type=None):
        document = super(TextIngestor, self).create_document(meta, type=type)
        pq = db.session.query(Page)
        pq = pq.filter(Page.document_id == document.id)
        pq.delete()
        return document

    def create_page(self, document, text, number=None):
        page = Page()
        page.document_id = document.id
        page.text = text
        page.number = number
        db.session.add(page)
        return page


class PlainTextIngestor(TextIngestor):
    MAX_SIZE = 5 * 1024 * 1024

    def ingest(self, meta, local_path):
        # TODO: chardet
        document = self.create_document(meta)
        with open(local_path, 'rb') as fh:
            text = fh.read()
            encoding = guess_encoding(text)
            if encoding is not None:
                text = text.decode(encoding)
                self.create_page(document, text)
                self.emit(document)

    @classmethod
    def match(cls, meta, local_path):
        if os.stat(local_path).st_size > cls.MAX_SIZE:
            return -1
        if meta.extension in ['txt', 'md', 'mdown']:
            return 5
        with open(local_path, 'rb') as fh:
            text = fh.read(4096)
            if '\0' in text:
                return -1
        # TODO: detect text file more smartly.
        return 1


class HtmlIngestor(TextIngestor):
    REMOVE_TAGS = ['script', 'style', 'link', 'input', 'textarea']
    MIME_TYPES = ['text/html']
    EXTENSIONS = ['html', 'htm', 'asp', 'aspx', 'jsp']

    def ingest(self, meta, local_path):
        with open(local_path, 'rb') as fh:
            doc = html.fromstring(fh.read())

            for name in self.REMOVE_TAGS:
                for tag in doc.findall('.//' + name):
                    tag.drop_tree()

            if not meta.has('title'):
                title = doc.findtext('.//title')
                if title is not None:
                    meta.title = title.strip()

            if not meta.has('summary'):
                summary = doc.find('.//meta[@name="description"]')
                if summary is not None and summary.get('content'):
                    meta.summary = summary.get('content')

            document = self.create_document(meta)
            body = doc.find('./body')
            if body is not None:
                self.create_page(document, body.text_content())
            self.emit(document)


class PDFIngestor(TextIngestor):
    MIME_TYPES = ['application/pdf']
    EXTENSIONS = ['pdf']

    def ingest(self, meta, local_path):
        data = extract_pdf(local_path)

        if not meta.has('author') and data.get('author'):
            meta['author'] = data.get('author')

        if not meta.has('title') and data.get('title'):
            meta.title = data.get('title')

        document = self.create_document(meta)
        for page in data['pages']:
            self.create_page(document, page)
        self.emit(document)


class DocumentIngestor(PDFIngestor):
    MIME_TYPES = ['application/msword', 'application/rtf', 'application/x-rtf',
                  'text/richtext', '']
    EXTENSIONS = ['doc', 'docx', 'rtf', 'odt', 'sxw', 'dot', 'docm',
                  'hqx', 'pdb']
    BASE_SCORE = 3

    def ingest(self, meta, local_path):
        pdf_path = document_to_pdf(local_path)
        if pdf_path is None:
            log.warning("Could not convert document: %r", meta)
            return
        try:
            super(DocumentIngestor, self).ingest(meta, pdf_path)
        finally:
            if os.path.isfile(pdf_path):
                os.unlink(pdf_path)


class ImageIngestor(TextIngestor):
    MIME_TYPES = ['image/png', 'image/tiff', 'image/x-tiff',
                  'image/jpeg', 'image/bmp', '  image/x-windows-bmp',
                  'image/x-portable-bitmap']
    EXTENSIONS = ['gif', 'png', 'jpg', 'jpeg', 'tif', 'tiff', 'bmp',
                  'jpe', 'pbm']
    BASE_SCORE = 3

    def ingest(self, meta, local_path):
        text = extract_image(local_path)
        if len(text) < 5:
            return
        document = self.create_document(meta)
        self.create_page(document, text)
        self.emit(document)
