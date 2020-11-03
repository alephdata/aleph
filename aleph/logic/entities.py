import logging
from banal import ensure_list, ensure_dict
from pprint import pformat  # noqa
from flask_babel import gettext
from followthemoney import model
from followthemoney.graph import Node
from followthemoney.types import registry
from followthemoney.helpers import inline_names
from followthemoney.exc import InvalidData

from aleph.core import db, cache
from aleph.model import Entity, Document, EntitySetItem, Mapping
from aleph.index import entities as index
from aleph.logic.notifications import flush_notifications
from aleph.logic.collections import MODEL_ORIGIN, refresh_collection
from aleph.logic.util import latin_alt
from aleph.index import xref as xref_index
from aleph.logic.aggregator import get_aggregator
from aleph.logic.graph import Graph

log = logging.getLogger(__name__)


def upsert_entity(data, collection, authz=None, sync=False):
    """Create or update an entity in the database. This has a side hustle
    of migrating entities created via the _bulk API or a mapper to a
    database entity in the event that it gets edited by the user.
    """
    from aleph.logic.profiles import profile_fragments

    entity = None
    entity_id = collection.ns.sign(data.get("id"))
    if entity_id is not None:
        entity = Entity.by_id(entity_id, collection=collection)
    if entity is None:
        role_id = authz.id if authz is not None else None
        entity = Entity.create(data, collection, role_id=role_id)
    else:
        entity.update(data, collection)

    # Inline name properties from adjacent entities. See the
    # docstring on `inline_names` for a more detailed discussion.
    proxy = entity.to_proxy()
    entity_ids = proxy.get_type_values(registry.entity)
    for rel in index.entities_by_ids(entity_ids):
        inline_names(proxy, model.get_proxy(rel))
    entity.data = proxy.properties
    db.session.add(entity)

    aggregator = get_aggregator(collection)
    aggregator.delete(entity_id=entity.id)
    aggregator.put(proxy, origin=MODEL_ORIGIN)

    # If the entity is part of a profile, tag it.
    profile_id = profile_fragments(collection, aggregator, entity_id=entity.id)
    if profile_id is not None:
        proxy.context["profile_id"] = [profile_id]

    aggregator.close()

    index.index_proxy(collection, proxy, sync=sync)
    refresh_entity(collection, entity.id)
    return entity.id


def validate_entity(data):
    """Check that there is a valid schema and all FtM conform to it."""
    schema = model.get(data.get("schema"))
    if schema is None:
        raise InvalidData(gettext("No schema on entity"))
    # This isn't strictly required because the proxy will contain
    # only those values that can be inserted for each property,
    # making it valid -- all this does, therefore, is to raise an
    # exception that notifies the user.
    schema.validate(data)


def check_write_entity(entity, authz):
    """Implement the cross-effects of mutable flag and the authz
    system for serialisers and API."""
    if authz.is_admin:
        return True
    collection_id = ensure_dict(entity.get("collection")).get("id")
    collection_id = entity.get("collection_id", collection_id)
    if not entity.get("mutable"):
        return False
    return authz.can(collection_id, authz.WRITE)


def transliterate_values(entity):
    """Generate transliterated strings for the names and addresses
    linked to the given entity proxy."""
    transliterated = {}
    for type_ in (registry.name, registry.address):
        for value in entity.get_type_values(type_):
            transliterated[value] = latin_alt(value)
    return transliterated


def refresh_entity(collection, entity_id):
    cache.kv.delete(cache.object_key(Entity, entity_id))
    refresh_collection(collection.id)


def delete_entity(collection, entity, deleted_at=None, sync=False):
    # This is recursive and will also delete any entities which
    # reference the given entity. Usually this is going to be child
    # documents, or directoships referencing a person. It's a pretty
    # dangerous operation, though.
    entity_id = collection.ns.sign(entity.get("id"))
    for adjacent in index.iter_adjacent(entity):
        log.warning("Recursive delete: %r", adjacent)
        delete_entity(collection, adjacent, deleted_at=deleted_at, sync=sync)
    flush_notifications(entity_id, clazz=Entity)
    obj = Entity.by_id(entity_id, collection=collection)
    if obj is not None:
        obj.delete()
    doc = Document.by_id(entity_id, collection=collection)
    if doc is not None:
        doc.delete()
    index.delete_entity(entity_id, sync=sync)
    EntitySetItem.delete_by_entity(entity_id)
    Mapping.delete_by_table(entity_id)
    xref_index.delete_xref(collection, entity_id=entity_id, sync=sync)
    aggregator = get_aggregator(collection)
    aggregator.delete(entity_id=entity_id)
    aggregator.close()
    refresh_entity(collection, entity_id)


def entity_tags(entity, authz=None, edge_types=registry.pivots):
    """Do a search on tags of an entity."""
    proxy = model.get_proxy(entity)
    edge_types = registry.get_types(edge_types)
    edge_types = [t for t in edge_types if t != registry.entity]
    graph = Graph(edge_types=edge_types)
    query = graph.query(authz=authz)
    nodes = set()
    for prop, value in proxy.itervalues():
        if prop.type not in graph.edge_types:
            continue
        if prop.specificity(value) < 0.1:
            continue
        nodes.add(Node(prop.type, value))
    for node in nodes:
        query.node(node, count=True)
    results = []
    for res in query.execute():
        if res.count is not None and res.count > 1:
            item = {
                "id": res.node.id,
                "field": res.node.type.group,
                "value": res.node.value,
                "count": res.count,
            }
            results.append(item)
    results.sort(key=lambda p: p["count"], reverse=True)
    return results


def entity_expand(
    entity, collection_ids, edge_types, limit, properties=None, authz=None
):
    """Expand an entity's graph to find adjacent entities that are connected
    by a common property value(eg: having the same email or phone number), a
    property (eg: Passport entity linked to a Person) or an Entity type edge.
    (eg: Person connected to Company through Directorship)

    collection_ids: list of collection_ids to search
    edge_types: list of FtM Types to expand as edges
    properties: list of FtM Properties to expand as edges.
    limit: max number of entities to return
    """
    proxy = model.get_proxy(entity)
    node = Node.from_proxy(proxy)
    graph = Graph(edge_types=edge_types)
    graph.add(proxy)
    query = graph.query(authz=authz, collection_ids=collection_ids)

    # Get relevant property set
    props = set(proxy.schema.properties.values())
    props = [p for p in props if p.type in graph.edge_types]
    properties = ensure_list(properties)
    if len(properties):
        props = [p for p in props if p.name in properties]

    # Query for reverse properties
    for prop in props:
        if prop.stub:
            query.edge(node, prop.reverse, limit=limit, count=True)
    query.execute()

    # Fill in missing graph entities:
    if limit > 0:
        graph.resolve()

    for prop in props:
        count = len(proxy.get(prop))
        if prop.stub:
            for res in query.patterns:
                if res.prop == prop.reverse:
                    count = res.count
        proxies = set()
        # Too much effort to do this right. This works, too:
        for edge in graph.get_adjacent(node, prop=prop):
            for part in (edge.proxy, edge.source.proxy, edge.target.proxy):
                if part is not None and part != proxy:
                    proxies.add(part)
        if count > 0:
            yield (prop, count, proxies)
