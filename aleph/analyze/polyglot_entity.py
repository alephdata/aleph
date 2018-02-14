from __future__ import absolute_import

import regex
import logging
from polyglot.text import Text
from polyglot.downloader import downloader
from normality import collapse_spaces

from aleph import settings
from aleph.analyze.analyzer import Analyzer
from aleph.model import Document, DocumentTag, DocumentTagCollector

log = logging.getLogger(__name__)


class PolyglotEntityAnalyzer(Analyzer):
    ORIGIN = 'polyglot'
    MIN_LENGTH = 100
    CLEAN = regex.compile('(^[^\w]*|[^\w]*$)')
    TYPES = {
        'I-PER': DocumentTag.TYPE_PERSON,
        'I-ORG': DocumentTag.TYPE_ORGANIZATION,
    }
    IGNORED = [
        Document.SCHEMA_PACKAGE,
        Document.SCHEMA_FOLDER,
        Document.SCHEMA_IMAGE,
        Document.SCHEMA_TABLE
    ]

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
            if len(self.languages) and language not in self.languages:
                continue
            text = Text(text, hint_language_code=language)
            for entity in text.entities:
                if entity.tag == 'I-LOC':
                    continue

                label = ' '.join(entity)
                label = self.CLEAN.sub(' ', label)
                label = collapse_spaces(label)
                if ' ' not in label or len(label) < 4 or len(label) > 200:
                    continue
                yield label, entity.tag

    def analyze(self, document):
        if document.schema in self.IGNORED:
            return

        collector = DocumentTagCollector(document, self.ORIGIN)
        try:
            languages = document.languages
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

        collector.save()
        if len(collector):
            log.info('Polyglot extracted %s entities.', len(collector))
