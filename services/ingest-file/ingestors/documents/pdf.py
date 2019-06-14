import logging
from pdflib import Document

from ingestors.ingestor import Ingestor
from ingestors.support.pdf import PDFSupport

log = logging.getLogger(__name__)


class PDFIngestor(Ingestor, PDFSupport):
    """PDF file ingestor class.

    Extracts the text from the document by converting it first to XML.
    Splits the file into pages.
    """
    MAGIC = '%PDF-1.'
    MIME_TYPES = ['application/pdf']
    EXTENSIONS = ['pdf']
    SCORE = 6

    def extract_xmp_metadata(self, pdf, entity):
        try:
            xmp = pdf.xmp_metadata
            if xmp is None:
                return
            entity.add('messageId', xmp['xmpmm'].get('documentid'))
            entity.add('title', xmp['dc'].get('title'))
            entity.add('generator', xmp['pdf'].get('producer'))
            entity.add('language', xmp['dc'].get('language'))
            entity.add('authoredAt', xmp['xmp'].get('createdate'))
            entity.add('modifiedAt', xmp['xmp'].get('modifydate'))
        except Exception as ex:
            log.warning("Error reading XMP: %r", ex)

    def extract_metadata(self, pdf, entity):
        meta = pdf.metadata
        if meta is not None:
            entity.add('title', meta.get("title"))
            entity.add('author', meta.get("author"))
            entity.add('generator', meta.get("creator"))
            entity.add('generator', meta.get("producer"))
            entity.add('keywords', meta.get("subject"))

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        # try:
        pdf = Document(bytes(file_path))
        self.extract_metadata(pdf, entity)
        self.extract_xmp_metadata(pdf, entity)
        self.pdf_extract(entity, pdf)
        # except Exception as ex:
        #     raise ProcessingException("Could not extract PDF file: %r", ex)

    @classmethod
    def match(cls, file_path, entity):
        score = super(PDFIngestor, cls).match(file_path, entity)
        if score <= 0:
            with open(file_path, 'rb') as fh:
                if fh.read(len(cls.MAGIC)) == cls.MAGIC:
                    return cls.SCORE * 2
        return score
