from __future__ import absolute_import
import logging
from collections import defaultdict
from polyglot.text import Text

from aleph.core import db
from aleph.text import slugify
from aleph.model import Reference, Entity
from aleph.analyze.analyzer import Analyzer


log = logging.getLogger(__name__)

SCHEMAS = {
    'I-PER': 'Person',
    'I-ORG': 'Organization'
}
DEFAULT_SCHEMA = 'LegalEntity'


class PolyglotEntityAnalyzer(Analyzer):

    origin = 'polyglot'

    def prepare(self):
        self.collection = self.document.collection
        # Collections managed by the system do not use this advanced entity
        # extraction. This used to be a separate toggle, but the use cases
        # for managed collections and entity generation simply seem to
        # overlap.
        self.disabled = self.collection.managed
        if self.document.type != self.document.TYPE_TEXT:
            self.disabled = True
        self.entity_schemata = defaultdict(list)
        self.entity_names = {}

    def on_text(self, text):
        if text is None or len(text) <= 100:
            return
        try:
            hint_language_code = None
            if len(self.meta.languages) == 1:
                hint_language_code = self.meta.languages[0]
            text = Text(text, hint_language_code=hint_language_code)
            for entity in text.entities:
                if entity.tag == 'I-LOC':
                    continue
                parts = [t for t in entity if t.lower() != t.upper()]
                if len(parts) < 2:
                    continue
                name = ' '.join(parts)
                if len(name) < 5 or len(name) > 150:
                    continue
                schema = SCHEMAS.get(entity.tag, DEFAULT_SCHEMA)
                fk = '%s:%s' % (self.origin, slugify(name))
                self.entity_schemata[fk].append(schema)
                self.entity_names[fk] = name
        except ValueError as ve:
            log.info('NER value error: %r', ve)
        except Exception as ex:
            log.warning('NER failed: %r', ex)

    def load_entity(self, fk, name, schema):
        entity = Entity.by_foreign_id(fk, self.collection.id, deleted=True)
        if entity is not None:
            return entity

        return Entity.save({
            'name': name,
            'schema': schema,
            'foreign_ids': [fk],
            'state': Entity.STATE_PENDING,
            'data': {}
        }, self.collection)

    def finalize(self):
        self.document.delete_references(origin=self.origin)
        for fk, schemas in self.entity_schemata.items():
            schema = max(set(schemas), key=schemas.count)
            name = self.entity_names.get(fk)
            entity = self.load_entity(fk, name, schema)
            if entity.deleted_at is not None:
                continue
            ref = Reference()
            ref.document_id = self.document.id
            ref.entity_id = entity.id
            ref.origin = self.origin
            ref.weight = len(schemas)
            db.session.add(ref)
        log.info('Polyglot extracted %s entities.', len(self.entity_schemata))
