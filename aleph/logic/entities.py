import logging
from banal import ensure_dict
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
from aleph.queues import queue_task, OP_UPDATE_ENTITY, OP_PRUNE_ENTITY
from aleph.logic.notifications import flush_notifications
from aleph.logic.collections import MODEL_ORIGIN, refresh_collection
from aleph.logic.xref import xref_entity
from aleph.logic.util import latin_alt
from aleph.index import xref as xref_index
from aleph.logic.aggregator import get_aggregator
from aleph.logic.graph import Graph

log = logging.getLogger(__name__)


def upsert_entity(data, collection, authz=None, sync=False, job_id=None):
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
    queue_task(collection, OP_UPDATE_ENTITY, job_id=job_id, entity_id=entity.id)
    return entity.id


def update_entity(collection, entity_id=None, job_id=None):
    """Update xref and aggregator after an entity has been edited."""
    log.info("[%s] Prune entity: %s", collection, entity_id)
    entity = index.get_entity(entity_id)
    proxy = model.get_proxy(entity)
    xref_entity(collection, proxy)


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


def delete_entity(collection, entity, sync=False, job_id=None):
    """Delete entity from index and redis, queue full prune."""
    entity_id = collection.ns.sign(entity.get("id"))
    index.delete_entity(entity_id, sync=sync)
    refresh_entity(collection, entity_id)
    queue_task(collection, OP_PRUNE_ENTITY, job_id=job_id, entity_id=entity_id)


def prune_entity(collection, entity_id=None, job_id=None):
    # This is recursive and will also delete any entities which
    # reference the given entity. Usually this is going to be child
    # documents, or directoships referencing a person. It's a pretty
    # dangerous operation, though.
    log.info("[%s] Prune entity: %s", collection, entity_id)
    for adjacent in index.iter_adjacent(collection.id, entity_id):
        log.warning("Recursive delete: %s", adjacent.get("id"))
        delete_entity(collection, adjacent, job_id=job_id)
    flush_notifications(entity_id, clazz=Entity)
    obj = Entity.by_id(entity_id, collection=collection)
    if obj is not None:
        obj.delete()
    doc = Document.by_id(entity_id, collection=collection)
    if doc is not None:
        doc.delete()
    EntitySetItem.delete_by_entity(entity_id)
    Mapping.delete_by_table(entity_id)
    xref_index.delete_xref(collection, entity_id=entity_id)
    aggregator = get_aggregator(collection)
    aggregator.delete(entity_id=entity_id)
    aggregator.close()
    refresh_entity(collection, entity_id)
    db.session.commit()
