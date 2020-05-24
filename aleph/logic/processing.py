import logging
from banal import is_mapping, ensure_list
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.helpers import remove_checksums

from aleph.index.entities import index_bulk
from aleph.logic.collections import refresh_collection
from aleph.logic.aggregator import get_aggregator

log = logging.getLogger(__name__)


def _fetch_entities(stage, collection, entity_ids, batch=100):
    aggregator = get_aggregator(collection)
    if entity_ids is not None:
        entity_ids = ensure_list(entity_ids)
        # WEIRD: Instead of indexing a single entity, this will try
        # pull a whole batch of them off the queue and do it at once.
        tasks = stage.get_tasks(limit=max(1, batch - len(entity_ids)))
        for task in tasks:
            entity_ids.extend(ensure_list(task.payload.get('entity_ids')))
        # FIXME: this doesn't retain mapping_id properly.
        stage.mark_done(len(tasks))

    yield from aggregator.iterate(entity_id=entity_ids)
    aggregator.close()


def index_aggregate(stage, collection, sync=False, entity_ids=None):
    """Project the contents of the collections aggregator into the index."""
    entities = _fetch_entities(stage, collection, entity_ids)
    index_bulk(collection, entities, sync=sync)
    refresh_collection(collection.id, sync=sync)


def bulk_write(collection, entities, unsafe=False, role_id=None):
    """Write a set of entities - given as dicts - to the index."""
    # This is called mainly by the /api/2/collections/X/_bulk API.
    def _generate():
        for data in entities:
            if not is_mapping(data):
                raise InvalidData("Failed to read input data", errors=data)
            entity = model.get_proxy(data)
            if entity.id is None:
                raise InvalidData("No ID for entity", errors=entity.to_dict())
            if not unsafe:
                entity = remove_checksums(entity)
            entity.context = {
                'role_id': role_id,
                'origin': 'bulk',
            }
            yield entity

    index_bulk(collection, _generate())
    refresh_collection(collection.id)
