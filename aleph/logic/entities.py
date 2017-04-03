from __future__ import absolute_import

import re
import logging
from collections import defaultdict

from aleph.core import db, celery, USER_QUEUE, USER_ROUTING_KEY
from aleph.text import match_form
from aleph.model import Entity, EntityIdentity, Reference, Document, Alert
from aleph.model.common import merge_data
from aleph.datasets.util import finalize_index
from aleph.index import index_entity, flush_index, delete_entity_leads
from aleph.index import delete_entity as index_delete
from aleph.search import load_entity
from aleph.index.entities import delete_entity_references
from aleph.index.entities import update_entity_references
from aleph.index.entities import delete_collection_entities
from aleph.search.records import scan_entity_mentions
from aleph.logic.leads import generate_leads

log = logging.getLogger(__name__)


def fetch_entity(entity_id):
    """Load entities from both the ES index and the database."""
    entity = load_entity(entity_id)
    obj = Entity.by_id(entity_id)
    if obj is not None:
        if entity is not None:
            entity.update(obj.to_dict())
        else:
            entity = obj.to_index()
            entity = finalize_index(entity, obj.schema)
        entity['ids'] = EntityIdentity.entity_ids(entity_id)
    elif entity is not None:
        entity['ids'] = [entity.get('id')]
    return entity, obj


def combined_entity(entity):
    """Use EntityIdentity mappings to construct a combined model of the
    entity with all data applied."""
    if 'id' not in entity:
        return entity
    if 'ids' not in entity:
        entity['ids'] = EntityIdentity.entity_ids(entity['id'])
    combined = dict(entity)
    for mapped_id in entity['ids']:
        if mapped_id == entity['id']:
            continue
        mapped = load_entity(mapped_id)
        if mapped is None:
            continue
        combined = merge_data(combined, mapped)
    return combined


def generate_entity_references(entity):
    # This is all a bit hacky: we're re-generating all the entity
    # references for the given entity by effectively re-implementing
    # the RegexEntityAnalyzer. The alternative was to conduct a
    # search for potential matching documents, re-analyze them and
    # re-index them. This proved to be too slow in reality.
    if entity.state != Entity.STATE_ACTIVE:
        entity.delete_references(origin='regex')
        return

    log.info("Updating document references: %r", entity)
    rex = '|'.join([t for t in entity.regex_terms])
    rex = re.compile('(%s)' % rex)

    documents = defaultdict(int)
    try:
        for document_id, text in scan_entity_mentions(entity):
            text = match_form(text)
            if text is None or len(text) <= 2:
                continue
            for match in rex.finditer(text):
                documents[document_id] += 1
    except Exception as ex:
        log.exception(ex)

    log.info("Re-matching %r gave %r documents.", entity,
             len(documents))

    entity.delete_references(origin='regex')
    for document_id, weight in documents.items():
        doc = Document.by_id(document_id)
        if doc is None:
            continue
        ref = Reference()
        ref.document_id = doc.id
        ref.entity_id = entity.id
        ref.origin = 'regex'
        ref.weight = weight
        db.session.add(ref)

    db.session.commit()
    delete_entity_references(entity.id)
    update_entity_references(entity)


def update_entity(entity):
    reindex_entity(entity, references=False)
    update_entity_full.apply_async([entity.id], queue=USER_QUEUE,
                                   routing_key=USER_ROUTING_KEY)
    # needed to make the call to view() work:
    flush_index()


def delete_entity(entity, deleted_at=None):
    entity.delete(deleted_at=deleted_at)
    delete_entity_leads(entity.id)
    update_entity_full(entity.id)


@celery.task()
def update_entity_full(entity_id):
    """Perform update operations on entities."""
    query = db.session.query(Entity).filter(Entity.id == entity_id)
    entity = query.first()
    generate_entity_references(entity)
    generate_leads(entity.id)
    reindex_entity(entity)
    Alert.dedupe(entity.id)


def reindex_entity(entity, references=True):
    log.info('Index [%s]: %s', entity.id, entity.name)
    if entity.state != Entity.STATE_ACTIVE:
        index_delete(entity.id)
        if references:
            delete_entity_references(entity.id)
    else:
        index_entity(entity)


@celery.task()
def reindex_entities():
    delete_collection_entities()
    query = db.session.query(Entity)
    for entity in query.yield_per(5000):
        reindex_entity(entity)


def delete_pending(collection_id=None):
    """Deletes any pending entities."""
    q = db.session.query(Entity.id)
    q = q.filter(Entity.state == Entity.STATE_PENDING)

    if collection_id is not None:
        q = q.filter(Entity.collection_id == collection_id)

    q.delete(synchronize_session='fetch')

    rq = db.session.query(Reference)
    sq = db.session.query(Entity.id)
    sq = sq.filter(Entity.state == Entity.STATE_PENDING)

    if collection_id is not None:
        sq = sq.filter(Entity.collection_id == collection_id)

    rq = rq.filter(Reference.entity_id.in_(sq))
    rq.delete(synchronize_session='fetch')

    db.session.commit()
    flush_index()
