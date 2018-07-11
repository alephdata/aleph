import logging
from flask import current_app

from aleph import settings
from aleph.model import DocumentTagCollector
from alephclient.services.common_pb2 import Text

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


class TextIterator(object):
    MIN_LENGTH = 100

    def text_iterator(self, document):
        app = current_app._get_current_object()
        return self._text_iterator(app, document)

    def _text_iterator(self, app, document):
        with app.app_context():
            languages = list(document.languages)
            if not len(languages):
                languages = [settings.DEFAULT_LANGUAGE]
            for text in document.texts:
                if text is None or len(text) <= self.MIN_LENGTH:
                    continue
                yield Text(text=text, languages=languages)
