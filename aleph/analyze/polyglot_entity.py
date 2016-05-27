from __future__ import absolute_import
import logging
from collections import defaultdict
from polyglot.text import Text

from aleph.core import db
from aleph.model import Reference, Entity, Collection
from aleph.model.entity_details import EntityIdentifier
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
        self.disabled = not self.document.source.generate_entities
        self.entities = defaultdict(list)

    def on_text(self, text):
        if text is None or len(text) <= 100:
            return
        text = Text(text)
        if len(self.meta.languages) == 1:
            text.hint_language_code = self.meta.languages[0]
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

    def load_collection(self):
        if not hasattr(self, '_collection'):
            self._collection = Collection.by_foreign_id('polyglot:ner', {
                'label': 'Automatically Extracted Persons and Companies',
                'public': True
            })
        return self._collection

    def load_entity(self, name, schema):
        q = db.session.query(EntityIdentifier)
        q = q.order_by(EntityIdentifier.deleted_at.desc().nullsfirst())
        q = q.filter(EntityIdentifier.scheme == self.origin)
        q = q.filter(EntityIdentifier.identifier == name)
        ident = q.first()
        if ident is not None:
            if ident.deleted_at is None:
                return ident.entity_id
            if ident.entity.deleted_at is None:
                return None

        data = {
            'name': name,
            '$schema': schema,
            'state': Entity.STATE_PENDING,
            'identifiers': [{
                'scheme': self.origin,
                'identifier': name
            }],
            'collections': [self.load_collection()]
        }
        entity = Entity.save(data)
        return entity.id

    def finalize(self):
        output = []
        for entity_name, schemas in self.entities.items():
            schema = max(set(schemas), key=schemas.count)
            output.append((entity_name, len(schemas), schema))

        Reference.delete_document(self.document.id, origin=self.origin)
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
