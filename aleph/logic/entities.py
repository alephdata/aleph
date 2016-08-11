from __future__ import absolute_import

import re
import logging
from collections import defaultdict

from aleph import graph
from aleph.core import db, celery, USER_QUEUE, USER_ROUTING_KEY
from aleph.text import normalize_strong
from aleph.model import Entity, Reference, Document, Alert
from aleph.index import index_entity
from aleph.index import delete_entity as index_delete
from aleph.index.entities import delete_entity_references
from aleph.index.entities import update_entity_references
from aleph.search.records import scan_entity_mentions

log = logging.getLogger(__name__)


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
    rex = '|'.join(entity.regex_terms)
    rex = re.compile('( |^)(%s)( |$)' % rex)

    documents = defaultdict(int)
    try:
        for document_id, text in scan_entity_mentions(entity):
            text = normalize_strong(text)
            if text is None or len(text) <= 2:
                continue
            for match in rex.finditer(text):
                documents[document_id] += 1
    except Exception:
        log.exception('Failed to fully scan documents for entity refresh.')
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
    update_entity_references(entity.id)


def update_entity(entity):
    reindex_entity(entity, references=False)
    with graph.transaction() as tx:
        graph.load_entity(tx, entity)
    update_entity_full.apply_async([entity.id], queue=USER_QUEUE,
                                   routing_key=USER_ROUTING_KEY)


def delete_entity(entity, deleted_at=None):
    update_entity(entity)
    with graph.transaction() as tx:
        graph.remove_entity(tx, entity.id)
    entity.delete(deleted_at=deleted_at)


@celery.task()
def update_entity_full(entity_id):
    """Perform update operations on entities."""
    query = db.session.query(Entity).filter(Entity.id == entity_id)
    entity = query.first()
    generate_entity_references(entity)
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
    query = db.session.query(Entity)
    for entity in query.yield_per(5000):
        reindex_entity(entity)
