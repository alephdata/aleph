import logging
from banal import is_mapping, ensure_list
from followthemoney import model
from followthemoney.types import registry
from followthemoney.exc import InvalidData
from followthemoney.pragma import remove_checksums

from aleph.model import Entity
from aleph.index.entities import index_bulk
from aleph.logic.entities import refresh_entity
from aleph.logic.collections import refresh_collection
from aleph.logic.aggregator import get_aggregator

log = logging.getLogger(__name__)


def _process_entity(entity, sync=False):
    """Perform pre-index processing on an entity, includes running the
    NLP pipeline."""
    name_entity(entity)
    refresh_entity(entity.id, sync=sync)
    # log.debug("Index: %r", entity)
    return entity


def name_entity(entity):
    """If an entity has multiple names, pick the most central one
    and set all the others as aliases. This is awkward given that
    names aren't special and may not always be the caption."""
    if not entity.schema.is_a(Entity.THING):
        return
    names = entity.get('name')
    if len(names) <= 1:
        return
    name = registry.name.pick(names)
    names.remove(name)
    entity.set('name', name)
    entity.add('alias', names)


def _fetch_entities(stage, collection, entity_ids=None, batch=100):
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


def index_aggregate(stage, collection, sync=False, entity_ids=None,
                    mapping_id=None):
    """Project the contents of the collections aggregator into the index."""
    entities = _fetch_entities(stage, collection, entity_ids=entity_ids)
    entities = (_process_entity(e, sync=sync) for e in entities)
    extra = {'job_id': stage.job.id, 'mapping_id': mapping_id}
    index_bulk(collection, entities, extra, sync=sync)
    refresh_collection(collection.id, sync=sync)


def bulk_write(collection, entities, job_id=None, unsafe=False):
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
            yield _process_entity(entity)

    index_bulk(collection, _generate(), {'job_id': job_id})
    refresh_collection(collection.id)
