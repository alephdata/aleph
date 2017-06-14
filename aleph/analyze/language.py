import logging
from collections import defaultdict
from langid.langid import LanguageIdentifier, model
# https://github.com/saffsd/langid.py

from aleph.core import language_whitelist
from aleph.analyze.analyzer import Analyzer

log = logging.getLogger(__name__)

THRESHOLD = 0.9
CUTOFF = 50


class LanguageAnalyzer(Analyzer):

    @property
    def identifier(self):
        if not hasattr(LanguageAnalyzer, '_identifier'):
            LanguageAnalyzer._identifier = \
                LanguageIdentifier.from_modelstring(model, norm_probs=True)
        return LanguageAnalyzer._identifier

    def prepare(self):
        self.languages = defaultdict(float)

    def on_text(self, text):
        if len(self.document.languages) > 0:
            return
        if len(text.strip()) <= CUTOFF:
            return
        lang, score = self.identifier.classify(text)
        if score > THRESHOLD:
            self.languages[lang] += score * len(text)

    def finalize(self):
        if not len(self.languages):
            return

        for code, score in self.languages.items():
            if code.lower() in language_whitelist:
                self.document.add_language(code)

        log.info("Classified languages in %r: %r", self.document,
                 self.document.languages)
