import logging

from aleph import settings
from aleph.analyze.analyzer import Analyzer

log = logging.getLogger(__name__)

THRESHOLD = 0.8


class LanguageAnalyzer(Analyzer):
    PRIORITY = 100
    MAX_LENGTH = 40000

    def __init__(self):
        self.active = settings.ANALYZE_LANGUAGE
        if self.active:
            from langid.langid import LanguageIdentifier as lid, model
            self.identifier = lid.from_modelstring(model, norm_probs=True)
            langs = set(settings.LANGUAGES)
            langs = langs.intersection(self.identifier.nb_classes)
            self.identifier.set_languages(langs)

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
        if not document.supports_nlp:
            document.languages = []
            return

        text = self._text_sample(document)
        lang, score = self.identifier.classify(text)
        if score >= THRESHOLD:
            document.add_language(lang)

        if len(document.languages):
            log.info("Language [%s]: %r", document.id, document.languages)
