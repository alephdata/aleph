from __future__ import absolute_import

import regex
import logging
from polyglot.text import Text
from polyglot.downloader import downloader
from normality import collapse_spaces

from aleph import settings
from aleph.analyze.analyzer import EntityAnalyzer
from aleph.model import DocumentTag

log = logging.getLogger(__name__)


class PolyglotEntityAnalyzer(EntityAnalyzer):
    ORIGIN = 'polyglot'
    MIN_LENGTH = 100
    CLEAN = regex.compile('(^[^\w]*|[^\w]*$)')
    TYPES = {
        'I-PER': DocumentTag.TYPE_PERSON,
        'I-ORG': DocumentTag.TYPE_ORGANIZATION,
    }

    def __init__(self):
        self.active = settings.ANALYZE_POLYGLOT

    @property
    def languages(self):
        cls = type(self)
        if not hasattr(cls, '_languages'):
            try:
                packages = downloader.packages()
                packages = [p for p in packages if p.task == 'ner2']
                cls._languages = [p.language for p in packages]
            except Exception:
                log.info("Cannot load polyglot language list.")
        return cls._languages

    def tag_text(self, text, languages):
        for language in languages:
            parsed = Text(text, hint_language_code=language)
            for entity in parsed.entities:
                if entity.tag == 'I-LOC':
                    continue

                label = ' '.join(entity)
                label = self.CLEAN.sub(' ', label)
                label = collapse_spaces(label)
                if ' ' not in label or len(label) < 4 or len(label) > 200:
                    continue
                yield label, entity.tag

    def extract(self, collector, document):
        try:
            languages = set(document.languages)
            if len(self.languages):
                languages = languages.intersection(self.languages)
            if not len(languages):
                languages = [settings.DEFAULT_LANGUAGE]

            for text in document.texts:
                if len(text) <= self.MIN_LENGTH:
                    continue
                for label, tag in self.tag_text(text, languages):
                    # log.info("Entity [%s]: %s", document.id, label)
                    collector.emit(label, self.TYPES[tag])
        except ValueError as ve:
            log.warning('NER value error: %r', ve)

        if len(collector):
            log.info('Polyglot extracted %s entities.', len(collector))
