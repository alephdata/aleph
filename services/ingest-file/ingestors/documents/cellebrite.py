import logging

from followthemoney import model

from ingestors.ingestor import Ingestor
from ingestors.support.cellebrite import CellebriteSupport
from ingestors.support.encoding import EncodingSupport

log = logging.getLogger(__name__)


class CellebriteIngestor(Ingestor, EncodingSupport, CellebriteSupport):
    "Ingestor for Cellebrite XML reports"
    MIME_TYPES = ['text/xml']
    EXTENSIONS = ['xml']
    SCORE = 0.5

    def _item(self, meta, name):
        query = './ns:item[@name="%s"]/text()' % name
        return meta.xpath(query, namespaces=self.NSMAP)

    def ingest(self, file_path, entity):
        """Ingestor implementation."""
        entity.schema = model.get('Document')
        project_id, owner = self.parse_metadata(entity, file_path)
        self.parse_content(entity, file_path, owner, project_id)

    @classmethod
    def match(cls, file_path, entity):
        score = super(CellebriteIngestor, cls).match(file_path, entity)
        if score <= 0:
            return score
        with open(file_path, 'r') as fp:
            data = fp.read(1024 * 16)
            namespace = 'xmlns="%s"' % cls.NS
            if namespace in data:
                return cls.SCORE * 30
        return -1
