import logging
from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.html import HTMLSupport
from ingestors.support.encoding import EncodingSupport

log = logging.getLogger(__name__)


class SVGIngestor(Ingestor, EncodingSupport, HTMLSupport):
    MIME_TYPES = ["image/svg+xml"]
    EXTENSIONS = ["svg"]
    SCORE = 20

    def ingest(self, file_path, entity):
        entity.schema = model.get("HyperText")
        html_body = self.read_file_decoded(entity, file_path)
        text = self.extract_html_content(entity, html_body)
        entity.add("bodyText", text)
