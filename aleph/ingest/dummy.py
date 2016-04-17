import logging

from aleph.ingest.ingestor import Ingestor

log = logging.getLogger(__name__)


class SkipIngestor(Ingestor):
    MIME_TYPES = []
    EXTENSIONS = ['emf', 'rels']
    BASE_SCORE = 10

    def ingest(self, meta, local_path):
        log.info("Skip: %r", meta)
