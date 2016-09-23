from __future__ import absolute_import
import logging
from collections import defaultdict
from polyglot.text import Text

from aleph.core import db
from aleph.model import Reference, Entity
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
        self.collections = []
        for collection in self.document.collections:
            if collection.generate_entities:
                self.collections.append(collection)
        self.disabled = not len(self.collections)
        self.entities = defaultdict(list)

    def on_text(self, text):
        if self.disabled or text is None or len(text) <= 100:
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
        except ValueError:
            self.disabled = True
        except Exception as ex:
            self.disabled = True
            log.warning('NER failed: %r', ex)

    def load_entity(self, name, schema):
        identifier = name.lower().strip()
        q = db.session.query(EntityIdentifier)
        q = q.order_by(EntityIdentifier.deleted_at.desc().nullsfirst())
        q = q.filter(EntityIdentifier.scheme == self.origin)
        q = q.filter(EntityIdentifier.identifier == identifier)
        ident = q.first()
        if ident is not None:
            if ident.deleted_at is None:
                # TODO: add to collections? Security risk here.
                return ident.entity_id
            if ident.entity.deleted_at is None:
                return None

        data = {
            'name': name,
            '$schema': schema,
            'state': Entity.STATE_PENDING,
            'identifiers': [{
                'scheme': self.origin,
                'identifier': identifier
            }]
        }
        entity = Entity.save(data, self.collections)
        return entity.id

    def finalize(self):
        if self.disabled:
            return

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
