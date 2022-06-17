# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

import logging
from banal import ensure_dict
from pprint import pformat  # noqa
from flask_babel import gettext
from followthemoney import model
from followthemoney.types import registry
from followthemoney.exc import InvalidData

from aleph.core import db, cache
from aleph.model import Entity, Document, EntitySetItem, Mapping
from aleph.index import entities as index
from aleph.queues import pipeline_entity, queue_task
from aleph.queues import OP_UPDATE_ENTITY, OP_PRUNE_ENTITY
from aleph.logic.notifications import flush_notifications
from aleph.logic.collections import refresh_collection
from aleph.logic.collections import MODEL_ORIGIN
from aleph.logic.util import latin_alt
from aleph.index import xref as xref_index
from aleph.logic.aggregator import get_aggregator

log = logging.getLogger(__name__)


def upsert_entity(data, collection, authz=None, sync=False, sign=False, job_id=None):
    """Create or update an entity in the database. This has a side effect  of migrating
    entities created via the _bulk API or a mapper to a database entity in the event
    that it gets edited by the user.
    """
    from aleph.logic.profiles import profile_fragments

    entity = None
    entity_id = collection.ns.sign(data.get("id"))
    if entity_id is not None:
        entity = Entity.by_id(entity_id, collection=collection)
    if entity is None:
        role_id = authz.id if authz is not None else None
        entity = Entity.create(data, collection, sign=sign, role_id=role_id)
    else:
        entity.update(data, collection, sign=sign)
    collection.touch()

    proxy = entity.to_proxy()
    aggregator = get_aggregator(collection)
    aggregator.delete(entity_id=proxy.id)
    aggregator.put(proxy, origin=MODEL_ORIGIN)
    profile_fragments(collection, aggregator, entity_id=proxy.id)

    index.index_proxy(collection, proxy, sync=sync)
    refresh_entity(collection, proxy.id)
    queue_task(collection, OP_UPDATE_ENTITY, job_id=job_id, entity_id=proxy.id)
    return entity.id


def update_entity(collection, entity_id=None, job_id=None):
    """Worker post-processing for entity changes. This action collects operations
    that should be done after each change to an entity but are too slow to run
    inside the request cycle.

    Update xref and aggregator, trigger NER and re-index."""
    from aleph.logic.xref import xref_entity
    from aleph.logic.profiles import profile_fragments

    log.info("[%s] Update entity: %s", collection, entity_id)
    entity = index.get_entity(entity_id)
    proxy = model.get_proxy(entity)
    if collection.casefile:
        xref_entity(collection, proxy)

    aggregator = get_aggregator(collection, origin=MODEL_ORIGIN)
    profile_fragments(collection, aggregator, entity_id=entity_id)
    inline_names(aggregator, proxy)
    pipeline_entity(collection, proxy, job_id=job_id)


def inline_names(aggregator, proxy):
    """Attempt to solve a weird UI problem. Imagine, for example, we
    are showing a list of payments between a sender and a beneficiary to
    a user. They may now conduct a search for a term present in the sender
    or recipient name, but there will be no result, because the name is
    only indexed with the parties, but not in the payment. This is part of
    a partial work-around to that.

    This is really bad in theory, but really useful in practice. Shoot me.
    """
    prop = proxy.schema.get("namesMentioned")
    if prop is None:
        return
    entity_ids = proxy.get_type_values(registry.entity)
    names = set()
    for related in index.entities_by_ids(entity_ids):
        related = model.get_proxy(related)
        names.update(related.get_type_values(registry.name))

    if len(names) > 0:
        name_proxy = model.make_entity(proxy.schema)
        name_proxy.id = proxy.id
        name_proxy.add(prop, names)
        aggregator.put(name_proxy, fragment="names")


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
    transliterated = {entity.caption: latin_alt(entity.caption)}
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
    """Prune handles the full deletion of an entity outside of the HTTP request
    cycle. This involves cleaning up adjacent entities like xref results, notifications
    and so on."""
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
    refresh_entity(collection, entity_id)
    collection.touch()
    db.session.commit()
