import logging

from aleph.core import db, celery
from aleph.model import Entity, Alert
from aleph.index import index_entity, delete_entity
from aleph.analyze import analyze_entity

log = logging.getLogger(__name__)


def update_entity(entity):
    """Perform some update operations on entities."""
    try:
        if entity.state != Entity.STATE_ACTIVE:
            delete_entity(entity.id)
        else:
            index_entity(entity)
        Alert.dedupe(entity.id)
    except Exception as ex:
        log.exception(ex)
    analyze_entity.delay(entity.id)


@celery.task()
def reindex_entities():
    query = db.session.query(Entity)
    for entity in query.yield_per(1000):
        log.info('Index [%s]: %s', entity.id, entity.name)
        if entity.deleted_at:
            delete_entity(entity.id)
        else:
            index_entity(entity)
