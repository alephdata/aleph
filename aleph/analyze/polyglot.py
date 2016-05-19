from __future__ import absolute_import
import logging
from time import time
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

    def extract_entities(self, document, meta):
        entities = defaultdict(list)
        for text, rec in document.text_parts():
            if text is None or len(text) <= 100:
                continue
            text = Text(text)
            if len(meta.languages) == 1:
                text.hint_language_code = meta.languages[0]
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
                entities[entity_name].append(schema)
        output = []
        for entity_name, schemas in entities.items():
            schema = max(set(schemas), key=schemas.count)
            output.append((entity_name, len(schemas), schema))
        return output

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
            return ident.entity_id

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

    def analyze(self, document, meta):
        if not document.source.generate_entities:
            return

        begin_time = time()
        try:
            entities = self.extract_entities(document, meta)
        except Exception as ex:
            log.warning(ex)
            return

        Reference.delete_document(document.id, origin=self.origin)
        for name, weight, schema in entities:
            ref = Reference()
            ref.document_id = document.id
            ref.entity_id = self.load_entity(name, schema)
            ref.weight = weight
            db.session.add(ref)
        self.save(document, meta)

        duration_time = int((time() - begin_time) * 1000)
        if len(entities):
            log.info("Tagged %r with %d entities (%sms)",
                     document, len(entities), duration_time)
        else:
            log.info("No entities on %r (%sms)",
                     document, duration_time)
