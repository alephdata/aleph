import logging
from banal import is_mapping
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.link import Link
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import es
from aleph.model import Document
from aleph.index.entities import get_entity
from aleph.index.core import entities_index
from aleph.logic.graph.cache import load_links, store_links, has_links
from aleph.util import make_key

log = logging.getLogger(__name__)


def _expand_group(type_, value):
    if type_.group is None or value is None:
        return
    query = {
        'query': {'term': {type_.group: value}},
        '_source': {'includes': ['schema', 'properties']}
    }
    for res in scan(es, index=entities_index(), query=query):
        entity_id = res.get('_id')
        entity_ref = registry.entity.ref(entity_id)
        source = res.get('_source')
        properties = source.get('properties')
        schema = model.get(source.get('schema'))
        for prop in schema.properties.values():
            if prop.type != type_:
                continue
            values = properties.get(prop.name)
            values = type_.normalize_set(values, cleaned=True)
            if value in values:
                link = Link(entity_ref, prop, value)
                yield link
                yield link.invert()


def expand_group(type_, value):
    ref = type_.ref(value)
    key = make_key('cache', ref)
    if has_links(key):
        yield from load_links(ref)
    else:
        links = _expand_group(type_, value)
        yield from store_links(key, links)


def _expand_entity(entity):
    """Transform an entity into a set of statements. This can
    accept either an entity object or an entity ID."""
    if not is_mapping(entity):
        entity = get_entity(entity)
    if entity is None:
        return
    if 'properties' not in entity:
        entity.update(Document.doc_data_to_schema(entity))
    yield from model.entity_links(entity)


def expand_entity(entity):
    entity_id = entity
    if is_mapping(entity):
        entity_id = entity.get('id')
    key = make_key('cache', entity_id)
    if has_links(key):
        ref = registry.entity.ref(entity_id)
        yield from load_links(ref)
    else:
        links = _expand_entity(entity)
        yield from store_links(key, links)


def traverse(type_, value, steam=2, path=None):
    if path is None:
        path = set()
    if (type_, value) in path:
        return
    path.add((type_, value))

    next_hops = set()
    if type_ == registry.entity:
        for link in _expand_entity(value):
            if link.prop.type.prefix:
                next_hops.add((link.prop.type, link.value, link.weight))
            yield (steam, link)

    for link in expand_group(type_, value):
        link = link.invert()
        next_hops.add((registry.entity, link.subject, link.weight))
        yield (steam, link)

    for (type_, value, weight) in next_hops:
        next_steam = steam * type_.specificity(value) * weight
        if next_steam > 0:
            yield from traverse(type_, value, steam=next_steam, path=path)


def traverse_entity(entity, steam=2):
    return traverse(registry.entity, entity, steam=steam)
