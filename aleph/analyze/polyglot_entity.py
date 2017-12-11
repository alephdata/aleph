from __future__ import absolute_import

import regex
import logging
from polyglot.text import Text
from normality import collapse_spaces

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

    def analyze(self, document):
        if document.schema in self.IGNORED:
            return

        collector = DocumentTagCollector(document, self.ORIGIN)
        text = document.text
        if text is None or len(text) <= self.MIN_LENGTH:
            return
        try:
            hint_language_code = None
            if len(document.languages) == 1:
                hint_language_code = document.languages[0]
            text = Text(text, hint_language_code=hint_language_code)
            for entity in text.entities:
                if entity.tag == 'I-LOC':
                    continue

                label = ' '.join(entity)
                label = self.CLEAN.sub(' ', label)
                label = collapse_spaces(label)
                if ' ' not in label or len(label) < 4 or len(label) > 200:
                    continue
                # log.info("Entity [Doc %s]: %s [%s]",
                #          document.id, label, entity.tag)
                collector.emit(label, self.TYPES[entity.tag])

        except ValueError as ve:
            log.warning('NER value error: %r', ve)
        except Exception as ex:
            log.warning('NER failed: %r', ex)
        finally:
            collector.save()
            log.info('Polyglot extracted %s entities.', len(collector))
