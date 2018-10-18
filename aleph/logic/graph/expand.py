import logging
from banal import is_mapping
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
    if type_.prefix is None or value is None:
        return
    value = str(value)
    # value = type_.clean(value)
    # if value is None:
    #     return
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
            values = type_.normalize_set(values)
            if value not in values:
                continue
            for item in values:
                ref = type_.ref(item)
                if prop.reverse:
                    yield Link(ref, prop.reverse, entity_id)
                else:
                    yield Link(ref, prop, entity_id, inverted=True)


def expand_entity(entity):
    """Transform an entity into a set of statements. This can
    accept either an entity object or an entity ID."""
    if not is_mapping(entity):
        entity = get_entity(entity)
    if entity is None:
        return
    if 'properties' not in entity:
        entity.update(Document.doc_data_to_schema(entity))

    proxy = model.get_proxy(entity)
    for link in proxy.links:
        yield link

    # TODO: factor out inference
    thing = model.get(Entity.THING)
    if proxy.schema.is_a(thing):
        sameAs = thing.get("sameAs")
        ref = registry.entity.ref(proxy.id)
        for (score, _, other) in xref_item(proxy):
            yield Link(ref, sameAs, other.id,
                       weight=score, inferred=True)


def expand_node(type_, value):
    try:
        yield from load_links(type_, value)
    except CacheMiss:
        log.debug("Cache miss [%s]: %s", type_, value)
        links = list(expand_group(type_, value))
        if type_ == registry.entity:
            links.extend(expand_entity(value))
        store_links(type_, value, links)
        yield from links
