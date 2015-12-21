import os
from lxml import html

from aleph.model import db, Page, Document
from aleph.ingest.ingestor import Ingestor


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
            text = fh.read().decode('utf-8', 'ignore')
            self.create_page(document, text)
        self.emit(document)

    @classmethod
    def match(cls, meta, local_path):
        if os.stat(local_path).st_size > cls.MAX_SIZE:
            return -1
        with open(local_path, 'rb') as fh:
            text = fh.read(4096)
            if '\0' in text:
                return -1
        # TODO: detect text file more smartly.
        return 1


class HtmlIngestor(TextIngestor):
    MAX_SIZE = 5 * 1024 * 1024
    REMOVE_TAGS = ['script', 'style', 'link', 'input', 'textarea']
    MIME_TYPES = ['text/html']
    EXTENSIONS = ['html', 'htm', 'asp', 'aspx', 'jsp']

    def parse_html(self, local_path):
        with open(local_path, 'rb') as fh:
            doc = html.parse(fh)
            for name in self.REMOVE_TAGS:
                for tag in doc.findall('//' + name):
                    tag.getparent().remove(tag)
            return doc

    def ingest(self, meta, local_path):
        doc = self.parse_html(local_path)

        title = doc.findtext('//title')
        if title is not None:
            meta.title = title.strip()

        summary = doc.find('//meta[@name="description"]')
        if summary is not None and summary.get('content'):
            meta.summary = summary.get('content')

        document = self.create_document(meta)
        self.create_page(document, doc.text_content())
        self.emit(document)
