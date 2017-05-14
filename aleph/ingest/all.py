import io
import sys
import traceback

from ingestors import PDFIngestor, DocumentIngestor, TextIngestor

from aleph.core import db, archive
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

    def exception_handler(self):
        """Legacy document error extraction and storage."""
        db.session.rollback()
        db.session.close()

        document = Document.by_meta(
            self.collection_id, self.aleph_meta)

        (error_type, error_message, error_details) = sys.exc_info()

        document.status = Document.STATUS_FAIL
        document.type = Document.TYPE_OTHER
        document.status = Document.STATUS_FAIL
        document.error_type = error_type.__name__
        document.error_message = unicode(error_message)
        document.error_details = unicode(traceback.format_exc())

        db.session.add(document)

        index_document(document)

        db.session.commit()

        super(AlephSupport, self).exception_handler()

    def save_results(self):
        """Extracts the ingestion results and stores them in the database."""
        document = Document.by_meta(self.collection_id, self.aleph_meta)
        document.status = Document.STATUS_SUCCESS
        document.meta.title = self.result.title

        if self.result.get('keywords'):
            document.meta.keywords = self.result.keywords

        if self.result.get('news_keywords'):
            map(document.meta.add_keyword, self.result.news_keywords)

        if self.result.get('urls'):
            map(document.meta.add_url, self.result.urls.keys())

        if self.result.get('description'):
            document.meta.summary = self.result.description

        if self.result.get('authors'):
            document.meta.author = ','.join(self.result.authors)

        if self.result.content:
            page = document.add_page(self.result.content, self.result.order)
            db.session.add(page)

        for child in self.children:
            page = document.add_page(child.result.content, child.result.order)

            db.session.add(page)

        db.session.add(document)
        db.session.commit()

        analyze_document(document)

        return document

    def before(self):
        document = Document.by_meta(self.collection_id, self.aleph_meta)
        document.type = self.DOCUMENT_TYPE
        document.status = Document.STATUS_PENDING
        document.error_type = None
        document.error_message = None
        document.error_details = None
        document.delete_pages()

        db.session.add(document)
        db.session.commit()

    def after(self):
        if self.status == self.STATUSES.SUCCESS:
            try:
                self.save_results()
            except:
                self.exception_handler()
        else:
            try:
                self.exception_handler()
            except:
                self.log_exception()


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

    def pdf_to_xml(self, *args, **kwargs):
        """Archive the PDF before the XML converstion."""
        document = Document.by_meta(self.collection_id, self.aleph_meta)

        file_meta = archive.archive_file(
            kwargs.get('file_path', args[1]), document.meta.pdf, move=False)

        document._meta['pdf_version'] = file_meta.content_hash
        # Weird SQLAlchemy stuff. The meta column is never updated otherwise.
        document.meta = document.meta

        db.session.add(document)
        db.session.commit()

        return super(AlephDocumentIngestor, self).pdf_to_xml(*args, **kwargs)
