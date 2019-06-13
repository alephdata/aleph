from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.pdf import PDFSupport
from ingestors.support.ooxml import OOXMLSupport


class OfficeOpenXMLIngestor(Ingestor, OOXMLSupport, PDFSupport):
    """Office/Word document ingestor class.

    Converts the document to PDF and extracts the text.
    Mostly a slightly adjusted PDF ingestor.
    """

    PREFIX = 'application/vnd.openxmlformats-officedocument.'
    MIME_TYPES = [
        PREFIX + 'wordprocessingml.document',
        PREFIX + 'wordprocessingml.template',
        PREFIX + 'presentationml.slideshow',
        PREFIX + 'presentationml.presentation',
        PREFIX + 'presentationml.template',
        PREFIX + 'presentationml.slideshow',
    ]
    EXTENSIONS = [
        'docx', 'docm', 'dotx', 'dotm',
        'potx', 'pptx', 'ppsx', 'pptm',
        'ppsm', 'potm'
    ]
    SCORE = 7

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get('Pages')
        self.ooxml_extract_metadata(file_path, entity)
        pdf_path = self.document_to_pdf(file_path, entity)
        self.pdf_alternative_extract(entity, pdf_path)

    @classmethod
    def match(cls, file_path, entity):
        score = super(OfficeOpenXMLIngestor, cls).match(file_path, entity)
        if score <= 0 and cls.inspect_ooxml_manifest(file_path):
            score = cls.SCORE * 2
        return score
