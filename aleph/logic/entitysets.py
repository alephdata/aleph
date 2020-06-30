import logging

from aleph.core import db
from aleph.model import EntitySet, Events
from aleph.logic.entities import upsert_entity
from aleph.logic.notifications import publish

log = logging.getLogger(__name__)


def get_entityset(entityset_id):
    return EntitySet.by_id(entityset_id)


def create_entityset(collection, data, authz):
    """Create an entityset. This will create or update any entities
    that already exist in the entityset and sign their IDs into the collection.
    """
    old_to_new_id_map = {}
    entity_ids = []
    for entity in data.pop('entities', []):
        old_id = entity.get('id')
        new_id = upsert_entity(entity, collection, validate=False, sync=True)
        old_to_new_id_map[old_id] = new_id
        entity_ids.append(new_id)
    data['entities'] = entity_ids
    entityset = EntitySet.create(data, collection, authz.id)
    db.session.commit()
    publish(Events.CREATE_ENTITYSET,
            params={'collection': collection, 'entityset': entityset},
            channels=[collection, authz.role],
            actor_id=authz.id)
    return entityset
