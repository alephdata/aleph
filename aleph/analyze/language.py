import logging
from langid.langid import LanguageIdentifier, model
# https://github.com/saffsd/langid.py

from aleph.core import language_whitelist
from aleph.model import Document
from aleph.analyze.analyzer import Analyzer

log = logging.getLogger(__name__)

THRESHOLD = 0.8
CUTOFF = 50


class LanguageAnalyzer(Analyzer):
    IGNORED = [
        Document.SCHEMA_PACKAGE,
        Document.SCHEMA_FOLDER
    ]

    @property
    def identifier(self):
        cls = type(self)
        if not hasattr(cls, '_identifier'):
            cls._identifier = LanguageIdentifier.from_modelstring(model, norm_probs=True)  # noqa
        return cls._identifier

    def analyze(self, document):
        if document.schema in self.IGNORED:
            return
        lang, score = self.identifier.classify(document.text)
        if score < THRESHOLD:
            return
        lang = lang.lower()
        if lang not in language_whitelist:
            return
        document.add_language(lang)
        log.info("Classified language [%s]: %r",
                 document.id, document.languages)
