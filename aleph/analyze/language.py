import logging
from langid.langid import LanguageIdentifier, model
# https://github.com/saffsd/langid.py

from aleph import settings
from aleph.model import Document
from aleph.analyze.analyzer import Analyzer

log = logging.getLogger(__name__)

THRESHOLD = 0.8


class LanguageAnalyzer(Analyzer):
    IGNORED = [
        Document.SCHEMA_PACKAGE,
        Document.SCHEMA_FOLDER,
        Document.SCHEMA_WORKBOOK,
    ]

    def __init__(self):
        self.active = settings.ANALYZE_LANGUAGE

    @property
    def identifier(self):
        cls = type(self)
        if not hasattr(cls, '_id'):
            cls._id = LanguageIdentifier.from_modelstring(model, norm_probs=True)  # noqa
            if len(settings.LANGUAGES):
                cls._id.set_languages(settings.LANGUAGES)
        return cls._id

    def analyze(self, document):
        if document.schema in self.IGNORED:
            return
        lang, score = self.identifier.classify(document.text)
        if score < THRESHOLD:
            return

        document.add_language(lang)
        log.info("Classified language [%s]: %r",
                 document.id, document.languages)
