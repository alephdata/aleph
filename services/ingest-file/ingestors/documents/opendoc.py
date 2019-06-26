from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.pdf import PDFSupport
from ingestors.support.opendoc import OpenDocumentSupport


class OpenDocumentIngestor(Ingestor, OpenDocumentSupport, PDFSupport):
    """Office/Word document ingestor class.

    Converts the document to PDF and extracts the text.
    Mostly a slightly adjusted PDF ingestor.

    Requires system tools:

    - Open/Libre Office with dependencies
    - image ingestor dependencies to cover any embeded images OCR

    """

    MIME_TYPES = [
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.text-template',
        'application/vnd.oasis.opendocument.presentation',
        'application/vnd.oasis.opendocument.graphics',
        'application/vnd.oasis.opendocument.graphics-flat-xml',
        'application/vnd.oasis.opendocument.graphics-template'
        'application/vnd.oasis.opendocument.presentation-flat-xml',
        'application/vnd.oasis.opendocument.presentation-template',
        'application/vnd.oasis.opendocument.chart',
        'application/vnd.oasis.opendocument.chart-template',
        'application/vnd.oasis.opendocument.image',
        'application/vnd.oasis.opendocument.image-template',
        'application/vnd.oasis.opendocument.formula',
        'application/vnd.oasis.opendocument.formula-template',
        'application/vnd.oasis.opendocument.text-flat-xml',
        'application/vnd.oasis.opendocument.text-master',
        'application/vnd.oasis.opendocument.text-web',
    ]
    EXTENSIONS = [
        'odt',
        'odp',
        'otp'
    ]
    SCORE = 7

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get('Pages')
        self.parse_opendocument(file_path, entity)
        pdf_path = self.document_to_pdf(file_path, entity)
        self.pdf_alternative_extract(entity, pdf_path)
