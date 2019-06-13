from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.html import HTMLSupport
from ingestors.support.encoding import EncodingSupport


class HTMLIngestor(Ingestor, EncodingSupport, HTMLSupport):
    "HTML file ingestor class. Extracts the text from the web page."
    MIME_TYPES = [
        'text/html'
    ]
    EXTENSIONS = [
        'htm',
        'html',
        'xhtml',
    ]
    SCORE = 6

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get('HyperText')
        html_body = self.read_file_decoded(entity, file_path)
        self.extract_html_content(entity, html_body)
