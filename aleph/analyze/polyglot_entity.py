from __future__ import absolute_import

import logging
from polyglot.text import Text

from aleph.analyze.analyzer import Analyzer
from aleph.model import DocumentTag, DocumentTagCollector

log = logging.getLogger(__name__)


class PolyglotEntityAnalyzer(Analyzer):
    ORIGIN = 'polyglot'
    MIN_LENGTH = 100
    TYPES = {
        'I-PER': DocumentTag.TYPE_PERSON,
        'I-ORG': DocumentTag.TYPE_ORGANIZATION,
        'I-LOC': DocumentTag.TYPE_LOCATION
    }

    def prepare(self):
        self.disabled = self.document.type != self.document.TYPE_TEXT
        self.collector = DocumentTagCollector(self.document, self.ORIGIN)

    def on_text(self, text):
        if text is None or len(text) <= self.MIN_LENGTH:
            return
        try:
            hint_language_code = None
            if len(self.document.languages) == 1:
                hint_language_code = self.document.languages[0]
            text = Text(text, hint_language_code=hint_language_code)
            for entity in text.entities:
                if entity.tag == 'I-LOC' or len(entity) == 1:
                    continue

                label = ' '.join(entity)
                if len(label) < 4 or len(label) > 200:
                    continue
                self.collector.emit(label, self.TYPES.get(entity.tag))

        except ValueError as ve:
            log.info('NER value error: %r', ve)
        except Exception as ex:
            log.warning('NER failed: %r', ex)

    def finalize(self):
        log.info('Polyglot extracted %s entities.', len(self.collector))
        self.collector.save()
