import sys
import tempfile
import traceback
import subprocess32 as subprocess
from functools import partial
from distutils.spawn import find_executable

from ingestors import(
    PDFIngestor, DocumentIngestor, TextIngestor, HTMLIngestor, ImageIngestor
)

from aleph.core import db, archive, WORKER_QUEUE, WORKER_ROUTING_KEY
from aleph.model import Document, DocumentPage
from aleph.metadata import Metadata
from aleph.analyze import analyze_document
from aleph.index import index_document
from aleph.ingest import ingest


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

    def detach(self, ingestor_class, fio, file_path, mime_type, extra=None):
        """Archives a file and schedules an ingestor job for it.

        If the path is blank, the IO object will be used to create the file.
        """
        if not file_path:
            with tempfile.NamedTemporaryFile(delete=False) as tmp_ing_file:
                for _bytes in iter(partial(fio.read, 1024), ''):
                        tmp_ing_file.write(_bytes)

            file_path = tmp_ing_file.name

        document = Document.by_meta(self.collection_id, self.aleph_meta)
        metadata = {
            'parent_document_id': document.id,
            'collection_id': self.collection_id,
            'source_path': file_path,
            'mime_type': mime_type
        }

        meta = Metadata.from_data(metadata)
        meta = archive.archive_file(file_path, meta, move=True)

        metadata.update(meta.to_attr_dict())

        if extra:
            metadata['ingestor_extra'] = extra

        ingest.apply_async(
            [self.collection_id, metadata],
            queue=WORKER_QUEUE, routing_key=WORKER_ROUTING_KEY
        )

    def save_page_results(self):
        """Extracts the page results and stores them in the database."""
        page = DocumentPage.query.filter(
            DocumentPage.document_id == self.result.get('document_id'),
            DocumentPage.id == self.result.get('page_id')
        ).first()

        # If this is not a page, return nothing
        if not page:
            return None

        page.text = self.result.content
        db.session.add(page)
        db.session.commit()

        document = page.document
        unprocessed_pages = document.pages.filter(
            DocumentPage.text == '', DocumentPage.number != 0).count()

        if unprocessed_pages == 0:
            document.status = Document.STATUS_SUCCESS
        else:
            document.status = Document.STATUS_PENDING

        db.session.add(document)
        db.session.commit()

        if document.status == Document.STATUS_SUCCESS:
            analyze_document(document)

        return document

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

        page = document.add_page(
            self.result.content or '', self.result.order or 1)
        db.session.add(page)

        db.session.add(document)
        db.session.commit()

        analyze_document(document)

        return document

    def before(self):
        if self.aleph_meta.ingestor_extra:
            self.result.update(self.aleph_meta.ingestor_extra)

        # Skip pages
        if self.result.get('page_id'):
            return

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
                # Try to save pages if any, fall-back to saving the document
                if not self.save_page_results():
                    self.save_results()
            except:
                self.exception_handler()
        else:
            try:
                self.exception_handler()
            except:
                self.log_exception()


class AlephPagesSupport(AlephSupport):
    """Provides database persistence support for paged documents."""

    def detach(self, ingestor_class, fio, file_path, mime_type, extra=None):
        """Will create a page record before detaching the ingestor work."""
        extra = extra or {}
        page_number = extra.get('order') or 0
        document = Document.by_meta(self.collection_id, self.aleph_meta)
        # TODO: Allow pages text to be nullable
        page = document.add_page(text='', page_number=page_number)

        db.session.add(page)
        db.session.commit()

        extra['document_id'] = document.id
        extra['page_id'] = page.id

        super(AlephPagesSupport, self).detach(
            ingestor_class, fio, file_path, mime_type, extra)


class AlephTextIngestor(AlephSupport, TextIngestor):
    EXTENSIONS = [
        'txt'
    ]


class AlephImageIngestor(AlephSupport, ImageIngestor):
    EXTENSIONS = [
        'gif',
        'png',
        'jpg',
        'jpeg',
        'tif',
        'tiff',
        'bmp',
        'jpe',
        'pbm'
    ]

    def ingest(self, config):
        """Adds PDF conversion and storage."""
        super(AlephImageIngestor, self).ingest(config)

        document = Document.by_meta(self.collection_id, self.aleph_meta)

        with tempfile.NamedTemporaryFile('r', suffix='.pdf') as pdfio:
            convert = [
                config['CONVERT_BIN'] or find_executable('convert'),
                self.file_path,
                '-density', '450',
                '-define', 'pdf:fit-page=A4',
                pdfio.name
            ]
            subprocess.call(convert)

            file_meta = archive.archive_file(
                pdfio.name, document.meta.pdf, move=False)

            document._meta['pdf_version'] = file_meta.content_hash
            # Weird SQLAlchemy stuff:
            #   The meta column is never updated otherwise.
            document.meta = document.meta

            db.session.add(document)
            db.session.commit()


class AlephHTMLIngestor(AlephSupport, HTMLIngestor):
    EXTENSIONS = [
        'html',
        'htm',
        'asp',
        'aspx',
        'jsp'
    ]


class AlephPDFIngestor(AlephPagesSupport, PDFIngestor):
    EXTENSIONS = [
        'pdf'
    ]


class AlephDocumentIngestor(AlephPagesSupport, DocumentIngestor):
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
