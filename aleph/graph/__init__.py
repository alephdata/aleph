import logging

from aleph.core import db
from aleph.model import Entity
from aleph.index import index_entity, delete_entity
from aleph.analyze import analyze_entity

log = logging.getLogger(__name__)


def update_entity(entity):
    """Perform some update operations on entities."""
    if entity.deleted_at:
        delete_entity(entity.id)
    else:
        index_entity(entity)
    analyze_entity.delay(entity.id)


def reindex_entities():
    query = db.session.query(Entity)
    for entity in query.yield_per(1000):
        log.info('Index [%s]: %r ', entity.id, entity.name)
        if entity.deleted_at:
            delete_entity(entity.id)
        else:
            index_entity(entity)
