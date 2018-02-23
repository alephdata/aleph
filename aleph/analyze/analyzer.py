import logging

from aleph.model import Document, DocumentTagCollector


log = logging.getLogger(__name__)


class Analyzer(object):
    PRIORITY = 10

    def __init__(self):
        self.active = True

    def analyze(self, document):
        pass


class EntityAnalyzer(Analyzer):
    IGNORED = [
        Document.SCHEMA,
        Document.SCHEMA_PACKAGE,
        Document.SCHEMA_FOLDER,
        Document.SCHEMA_WORKBOOK,
        # Document.SCHEMA_IMAGE,
        # Document.SCHEMA_TABLE
    ]

    def analyze(self, document):
        if document.schema in self.IGNORED:
            return

        collector = DocumentTagCollector(document, self.ORIGIN)
        try:
            self.extract(collector, document)
        finally:
            collector.save()

    def extract(self, collector, document):
        pass
