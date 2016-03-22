import logging
from collections import Counter

import langid
# https://github.com/saffsd/langid.py

from aleph.analyze.analyzer import Analyzer

log = logging.getLogger(__name__)

THRESHOLD = 0.8
CUTOFF = 30


class LanguageAnalyzer(Analyzer):

    def analyze_text(self, document, meta):
        if len(meta.languages):
            return
        languages = Counter()
        for page in document.pages:
            if not page.text or len(page.text) < CUTOFF:
                continue
            lang, score = langid.classify(page.text)
            if score > THRESHOLD:
                languages[lang] += 1
        self.save(document, meta, languages)

    def analyze_tabular(self, document, meta):
        if len(meta.languages):
            return
        languages = Counter()
        for record in document.records:
            for text in record.data.values():
                if not text or len(text) < CUTOFF:
                    continue
                lang, score = langid.classify(text)
                if score > THRESHOLD:
                    languages[lang] += 1
        self.save(document, meta, languages)

    def save(self, document, meta, languages):
        existing = meta.get('languages')
        if existing is not None and not len(existing) and len(languages):
            return
        meta['languages'] = [l for (l, c) in languages.most_common(1)]
        super(LanguageAnalyzer, self).save(document, meta)
