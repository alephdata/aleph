import logging

from aleph.model import db, Document
from aleph.ingest.ingestor import Ingestor

log = logging.getLogger(__name__)


class TabularIngestor(Ingestor):
    DOCUMENT_TYPE = Document.TYPE_TABULAR


# https://pypi.python.org/pypi/pyDBF/
