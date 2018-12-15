import logging
from banal import is_mapping
from pprint import pprint  # noqa
from normality import stringify
from followthemoney import model
from followthemoney.graph import Link
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import es, cache
from aleph.model import Entity
from aleph.index.indexes import entities_read_index
from aleph.logic.entities import get_entity
from aleph.logic.xref import xref_item

log = logging.getLogger(__name__)


def get_type_schemata(type_):
    """Return all the schemata which have a property with the given type."""
    schemata = set()
    for schema in schemata:
        for prop in schema.properties.values():
            if prop.type == type_:
                schemata.add(schema)
    return schemata


def _iter_value_entities(type_, value):
    query = {
        'query': {'term': {type_.group: value}},
        '_source': {'includes': ['schema', 'properties']}
    }
    index = entities_read_index(schema=get_type_schemata(type_))
    for res in scan(es, index=index, query=query):
        entity_id = res.get('_id')
        source = res.get('_source')
        properties = source.get('properties')
        schema = model.get(source.get('schema'))
        for prop in schema.properties.values():
            if prop.type != type_:
                continue
            values = properties.get(prop.name)
            values = type_.normalize_set(values)
            if value in values:
                yield entity_id, prop


def iter_value_entities(type_, value):
    value = stringify(value)
    if type_.group is None or value is None:
        return
    key = cache.object_key(type(type_), value)
    degree_key = cache.object_key(type(type_), value, 'deg1')
    degree = cache.get(degree_key)
    if degree is not None:
        for item in cache.kv.sscan_iter(key):
            qname, entity_id = item.decode('utf-8').split('@', 1)
            prop = model.get_qname(qname)
            yield entity_id, prop
    else:
        degree = 0
        pipe = cache.kv.pipeline()
        for entity_id, prop in _iter_value_entities(type_, value):
            yield entity_id, prop
            item = '@'.join((prop.qname, entity_id))
            pipe.sadd(key, item)
            degree += 1
        pipe.set(degree_key, degree, ex=cache.EXPIRE)
        pipe.execute()


def expand_entity(entity):
    """Transform an entity into a set of statements. This can
    accept either an entity object or an entity ID."""
    if not is_mapping(entity):
        entity = get_entity(entity)
    if entity is None:
        return

    proxy = model.get_proxy(entity)
    yield from proxy.links

    # TODO: factor out inference
    thing = model.get(Entity.THING)
    if proxy.schema.is_a(thing):
        sameAs = thing.get("sameAs")
        for (score, _, other) in xref_item(proxy):
            yield Link(proxy.node, sameAs, other.id,
                       weight=score, inferred=True)


def expand_node(node):
    if node.type == registry.entity:
        yield from expand_entity(node.value)

    for entity_id, prop in iter_value_entities(node.type, node.value):
        if prop.reverse:
            yield Link(node, prop.reverse, entity_id)
        else:
            yield Link(node, prop, entity_id, inverted=True)
