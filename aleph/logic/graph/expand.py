import logging
from banal import is_mapping
from pprint import pprint  # noqa
from followthemoney import model
from followthemoney.graph import Link
from followthemoney.types import registry
from elasticsearch.helpers import scan

from aleph.core import es
from aleph.model import Entity
from aleph.index.entities import get_entity
from aleph.index.core import entities_read_index
from aleph.logic.graph.cache import load_links, store_links
from aleph.logic.graph.cache import CacheMiss
from aleph.logic.xref import xref_item

log = logging.getLogger(__name__)


def expand_group(node):
    if node.type.group is None or node.value is None:
        return
    value = str(node.value)
    query = {
        'query': {'term': {node.type.group: value}},
        '_source': {'includes': ['schema', 'properties']}
    }
    for res in scan(es, index=entities_read_index(), query=query):
        entity_id = res.get('_id')
        source = res.get('_source')
        properties = source.get('properties')
        schema = model.get(source.get('schema'))
        for prop in schema.properties.values():
            if prop.type != node.type:
                continue
            values = properties.get(prop.name)
            values = node.type.normalize_set(values)
            if value not in values:
                continue
            if prop.reverse:
                yield Link(node, prop.reverse, entity_id)
            else:
                yield Link(node, prop, entity_id, inverted=True)


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
    try:
        yield from load_links(node)
    except CacheMiss:
        log.debug("Cache miss: %r", node)
        links = list(expand_group(node))
        if node.type == registry.entity:
            links.extend(expand_entity(node.value))
        store_links(node, links)
        yield from links
