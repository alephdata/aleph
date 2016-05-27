import logging
from collections import defaultdict
from langid.langid import LanguageIdentifier, model
# https://github.com/saffsd/langid.py

from aleph.analyze.analyzer import Analyzer

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
        self.disabled = len(self.meta.languages) > 0
        self.languages = defaultdict(float)

    def on_text(self, text):
        if len(text.strip()) < CUTOFF:
            return
        lang, score = self.identifier.classify(text)
        if score > THRESHOLD:
            self.languages[lang] += score * len(text)

    def finalize(self):
        if not len(self.languages):
            return

        languages = sorted(self.languages.items(), key=lambda (l, c): c,
                           reverse=True)
        self.meta.add_language(languages[0][0])
        log.info("Classified languages in %r: %r", self.document,
                 languages[:10])
