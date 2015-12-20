import os

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
