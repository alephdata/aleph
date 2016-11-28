from __future__ import absolute_import
import logging
from collections import defaultdict
from polyglot.text import Text

from aleph.core import db
from aleph.model import Reference, Entity
from aleph.analyze.analyzer import Analyzer


log = logging.getLogger(__name__)

SCHEMAS = {
    'I-PER': '/entity/person.json#',
    'I-ORG': '/entity/organization.json#'
}
DEFAULT_SCHEMA = '/entity/entity.json#'


class PolyglotEntityAnalyzer(Analyzer):

    origin = 'polyglot'

    def prepare(self):
        self.collection = self.document.collection
        self.disabled = not self.collection.generate_entities
        self.entities = defaultdict(list)

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
                entity_name = ' '.join(parts)
                if len(entity_name) < 5 or len(entity_name) > 150:
                    continue
                schema = SCHEMAS.get(entity.tag, DEFAULT_SCHEMA)
                self.entities[entity_name].append(schema)
        except ValueError as ve:
            log.info('NER value error: %r', ve)
        except Exception as ex:
            log.warning('NER failed: %r', ex)

    def load_entity(self, name, schema):
        identifier = name.lower().strip()
        q = db.session.query(Entity)
        q = q.order_by(Entity.deleted_at.desc().nullsfirst())
        q = q.filter(Entity.name == name)
        entity = q.first()
        if entity is not None:
            return entity

        data = {
            'name': name,
            '$schema': schema,
            'state': Entity.STATE_PENDING,
            'identifiers': [{
                'scheme': self.origin,
                'identifier': identifier
            }]
        }
        entity = Entity.save(data, [self.collection])
        return entity.id

    def finalize(self):
        output = []
        for entity_name, schemas in self.entities.items():
            schema = max(set(schemas), key=schemas.count)
            output.append((entity_name, len(schemas), schema))

        self.document.delete_references(origin=self.origin)
        for name, weight, schema in output:
            entity_id = self.load_entity(name, schema)
            if entity_id is None:
                continue
            ref = Reference()
            ref.document_id = self.document.id
            ref.entity_id = entity_id
            ref.origin = self.origin
            ref.weight = weight
            db.session.add(ref)
        log.info('Polyglot extraced %s entities.', len(output))
