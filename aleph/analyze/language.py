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

    def analyze(self, document, meta):
        if len(meta.languages):
            return

        languages = defaultdict(float)
        for text, rec in document.text_parts():
            if len(text.strip()) < CUTOFF:
                continue
            lang, score = self.identifier.classify(text)
            if score > THRESHOLD:
                languages[lang] += score * len(text)

        if not len(languages):
            return

        languages = sorted(languages.items(), key=lambda (l, c): c,
                           reverse=True)
        meta.add_language(languages[0][0])
        log.info("Classified languages in %r: %r", document, languages[:10])
        self.save(document, meta)
