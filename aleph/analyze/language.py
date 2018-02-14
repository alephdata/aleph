import logging

from aleph import settings
from aleph.model import Document
from aleph.analyze.analyzer import Analyzer

log = logging.getLogger(__name__)

THRESHOLD = 0.8


class LanguageAnalyzer(Analyzer):
    PRIORITY = 100
    MAX_LENGTH = 40000
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
            # https://github.com/saffsd/langid.py
            from langid.langid import LanguageIdentifier as lid, model
            cls._id = lid.from_modelstring(model, norm_probs=True)
            if len(settings.LANGUAGES):
                langs = set(settings.LANGUAGES)
                langs = langs.intersection(cls._id.nb_classes)
                cls._id.set_languages(langs)
        return cls._id

    def _text_sample(self, document):
        """Generate a text sample of limited length."""
        parts = []
        total = 0
        for text in document.texts:
            parts.append(text)
            total += len(text)
            if total >= self.MAX_LENGTH:
                break
        return '\n\n'.join(parts)

    def analyze(self, document):
        if document.schema in self.IGNORED:
            return
        text = self._text_sample(document)
        lang, score = self.identifier.classify(text)
        if score >= THRESHOLD:
            document.add_language(lang)

        if len(document.languages):
            log.info("Language [%s]: %r", document.id, document.languages)
