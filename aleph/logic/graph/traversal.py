import logging
from banal import is_mapping, ensure_list
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.link import Link
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import es
from aleph.model import Document, Entity
from aleph.index.entities import get_entity
from aleph.index.core import entities_index
from aleph.logic.graph.cache import load_links, store_links
from aleph.logic.graph.cache import CacheMiss
from aleph.logic.xref import xref_item

log = logging.getLogger(__name__)


def expand_group(type_, value):
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
                # link = Link(entity_ref, prop, value)
                yield Link(entity_ref, prop, value)


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

    # TODO: factor out inference
    thing = model.get(Entity.THING)
    if schema.is_a(thing):
        sameAs = thing.get("sameAs")
        ref = registry.entity.ref(entity.get('id'))
        for (score, other) in xref_item(entity):
            yield Link(ref, sameAs, other.get('id'), weight=score)

    properties = entity.get('properties', {})
    for prop in schema.properties.values():
        for value in ensure_list(properties.get(prop.name)):
            if value is None:
                continue
            yield Link(ref, prop, value)


def expand_node(type_, value):
    links = set()
    try:
        links.update(load_links(type_, value))
    except CacheMiss:
        log.debug("Cache miss [%s]: %s", type_, value)
        links.update(expand_group(type_, value))
        if type_ == registry.entity:
            links.update(expand_entity(value))
        store_links(type_, value, links)
    yield from links


def traverse(type_, value, steam=2, path=None):
    if path is None:
        path = set()
    if (type_, value) in path:
        return
    path.add((type_, value))
    log.info("Traverse: %s (%s), %s", value, type_, steam)
    ref = type_.ref(value)
    for link in expand_node(type_, value):
        if link.ref != ref:
            link = link.invert()
        yield (steam, link)
        specificity = link.prop.type.specificity(link.value)
        if specificity == 0:
            continue
        next_steam = steam * specificity * link.weight
        log.info("Link: %s -> %s", link, next_steam)
        if next_steam > 0:
            yield from traverse(link.prop.type, link.value,
                                steam=next_steam,
                                path=path)


def traverse_entity(entity, steam=2):
    return traverse(registry.entity, entity, steam=steam)
