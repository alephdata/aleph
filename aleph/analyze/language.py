import logging

import langid
# https://github.com/saffsd/langid.py

from aleph.analyze.analyzer import Analyzer

log = logging.getLogger(__name__)
THRESHOLD = 0.8
CUTOFF = 30


class LanguageAnalyzer(Analyzer):

    def analyze_text(self, document, meta):
        languages = set()
        for page in document.pages:
            if not page.text or len(page.text) < CUTOFF:
                continue
            lang, score = langid.classify(page.text)
            if score > THRESHOLD:
                languages.add(lang)
        self.save(document, meta, languages)

    def analyze_tabular(self, document, meta):
        languages = set()
        for table in document.tables:
            for row in table:
                for text in row.values():
                    if not text or len(text) < CUTOFF:
                        continue
                    lang, score = langid.classify(text)
                    if score > THRESHOLD:
                        languages.add(lang)
        self.save(document, meta, languages)

    def save(self, document, meta, languages):
        existing = meta.get('languages')
        if existing is None or not len(existing):
            meta['languages'] = list(languages)
            super(LanguageAnalyzer, self).save(document, meta)
