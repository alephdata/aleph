import logging

from aleph.model import DocumentTagCollector


log = logging.getLogger(__name__)


class Analyzer(object):
    PRIORITY = 10

    def __init__(self):
        self.active = True

    def analyze(self, document):
        pass


class EntityAnalyzer(Analyzer):

    def analyze(self, document):
        if not document.supports_nlp:
            return

        collector = DocumentTagCollector(document, self.ORIGIN)
        try:
            self.extract(collector, document)
        finally:
            collector.save()

    def extract(self, collector, document):
        pass
