import io
import sys

from ingestors import PDFIngestor, DocumentIngestor, TextIngestor

from aleph.core import db
from aleph.model import Document
from aleph.analyze import analyze_document
from aleph.index import index_document


class AlephSupport(object):

    EXTENSIONS = []
    BASE_SCORE = 5
    DOCUMENT_TYPE = Document.TYPE_TEXT

    #: Aleph specific attributes
    collection_id = None
    aleph_meta = None

    @classmethod
    def match(cls, meta, local_path):
        score = -1

        with io.open(local_path, 'rb') as fio:
            _, mime_type = TextIngestor.match(fio)

        if mime_type in cls.MIME_TYPES:
            score += cls.BASE_SCORE

        # Let's use the extension/mime-type matching as a backup.
        if meta.mime_type in cls.MIME_TYPES:
            score += cls.BASE_SCORE
        if meta.extension in cls.EXTENSIONS:
            score += cls.BASE_SCORE

        return score

    def save_document_error(self, document):
        """Legacy document error extraction and storage."""
        (error_type, error_message, error_details) = sys.exc_info()

        db.session.rollback()
        db.session.close()

        document.type = Document.TYPE_OTHER
        document.status = Document.STATUS_FAIL
        document.error_type = error_type
        document.error_message = error_message
        document.error_details = error_details

        db.session.add(document)
        db.session.commit()

    def save_document_results(self, document):
        if self.result.content:
            page = document.add_page(self.result.content, self.result.order)
            db.session.add(page)

        for child in self.children:
            page = document.add_page(child.result.content, child.result.order)

            db.session.add(page)

    def before(self):
        document = Document.by_meta(self.collection_id, self.aleph_meta)
        document.type = self.DOCUMENT_TYPE
        document.status = Document.STATUS_PENDING
        document.delete_pages()

        db.session.add(document)
        db.session.commit()

    def after(self):
        document = Document.by_meta(self.collection_id, self.aleph_meta)

        if self.status == self.STATUSES.FAILURE:
            document.status = Document.STATUS_FAIL
            try:
                self.save_document_error(document)
            except:
                self.log_exception()
        else:
            document.status = Document.STATUS_SUCCESS
            try:
                self.save_document_results(document)
            except:
                self.log_exception()

            db.session.add(document)
            db.session.commit()

            analyze_document(document)

        index_document(document)


class AlephTextIngestor(AlephSupport, TextIngestor):
    EXTENSIONS = [
        'txt'
    ]


class AlephPDFIngestor(AlephSupport, PDFIngestor):
    EXTENSIONS = [
        'pdf'
    ]


class AlephDocumentIngestor(AlephSupport, DocumentIngestor):
    EXTENSIONS = [
        'doc',
        'docx',
        'rtf',
        'odt',
        'sxw',
        'dot',
        'docm',
        'hqx',
        'pdb',
        'wpd',

        'ppt',
        'pptx',
        'odp',
        'pot',
        'pps',
        'ppa'
    ]
