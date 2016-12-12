import logging
from collections import defaultdict
from langid.langid import LanguageIdentifier, model
# https://github.com/saffsd/langid.py

from aleph.analyze.analyzer import Analyzer
from aleph.data.reference import get_language_whitelist

log = logging.getLogger(__name__)

THRESHOLD = 0.9
CUTOFF = 30


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
        if len(self.meta.languages) > 0:
            return
        if len(text.strip()) < CUTOFF:
            return
        lang, score = self.identifier.classify(text)
        if score > THRESHOLD:
            self.languages[lang] += score * len(text)

    def finalize(self):
        if len(self.meta.languages) > 0:
            return
        if not len(self.languages):
            return

        whitelist = get_language_whitelist()
        for code, score in self.languages.items():
            if code.lower() in whitelist:
                self.meta.add_language(code)
        log.info("Classified languages in %r: %r", self.document,
                 self.meta.languages)
