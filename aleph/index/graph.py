import logging
from banal import ensure_list, is_mapping
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import es
from aleph.model import Document
from aleph.index.entities import get_entity
from aleph.index.core import entities_index

log = logging.getLogger(__name__)


class Statement(object):

    def __init__(self, ref, prop, value, weight=1.0, inverted=False):
        self.ref = ref
        self.prop = prop
        self.value = value
        self.weight = weight
        self.inverted = inverted

    def pack(self):
        qualifier = '*' if self.inverted else ''
        if self.weight < 1.0:
            qualifier += self.weight
        return '>'.join((self.prop.qname, qualifier, self.value))

    @classmethod
    def unpack(cls, ref, packed):
        qname, qualifier, value = packed.split('>', 2)
        prop = model.get_qname(qname)
        # TODO: parse qualifier
        return cls(ref, prop, value)

    def invert(self):
        ref = self.prop.type.ref(self.value)
        _, value = registry.deref(self.ref)
        cls = type(self)
        return cls(ref, self.prop, value,
                   weight=self.weight,
                   inverted=not self.inverted)


def expand_group(type_, value):
    query = {
        'query': {'term': {type_.group: value}},
        '_source': {'includes': ['schema', 'properties']}
    }
    for res in scan(es, index=entities_index(), query=query):
        entity_id = res.get('_id')
        source = res.get('_source')
        properties = source.get('properties')
        schema = model.get(source.get('schema'))
        for prop in schema.properties.values():
            if prop.type != type_:
                continue
            values = properties.get(prop.name)
            values = type_.normalize_set(values, cleaned=True)
            if value in values:
                yield (entity_id, prop, value)


def expand_entity(entity):
    """Transform an entity into a set of statements. This can
    accept either an entity object or an entity ID."""
    if not is_mapping(entity):
        entity = get_entity(entity)
    if entity is None:
        return
    if 'properties' not in entity:
        entity.update(Document.doc_data_to_schema(entity))

    schema = model.get(entity.get('schema'))
    if schema is None:
        return

    properties = entity.get('properties', {})
    for prop in schema.properties.values():
        if prop.name not in properties:
            continue
        for value in ensure_list(properties.get(prop.name)):
            yield (entity.get('id'), prop, value)


def traverse(type_, value, steam=2):
    pass


def traverse_entity(entity, steam=2):
    return traverse(registry.entity, entity, steam=steam)
