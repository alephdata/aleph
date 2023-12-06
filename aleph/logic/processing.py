import logging
from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry
from followthemoney.exc import InvalidData
from followthemoney.helpers import remove_checksums

from aleph.logic.collections import index_aggregator, refresh_collection
from aleph.logic.aggregator import get_aggregator

log = logging.getLogger(__name__)
BATCH_SIZE = 100


def index_many(stage, collection, sync=False, entity_ids=None, batch=BATCH_SIZE):
    """Project the contents of the collections aggregator into the index."""
    if entity_ids is not None:
        entity_ids = ensure_list(entity_ids)
        # WEIRD: Instead of indexing a single entity, this will try
        # pull a whole batch of them off the queue and do it at once.
        tasks = stage.get_tasks(limit=max(1, batch - len(entity_ids)))
        for task in tasks:
            entity_ids.extend(ensure_list(task.payload.get("entity_ids")))
        stage.mark_done(len(tasks))
    aggregator = get_aggregator(collection)
    index_aggregator(collection, aggregator, entity_ids=entity_ids, sync=sync)
    refresh_collection(collection.id)


def bulk_write(collection, entities, safe=False, role_id=None, mutable=True, clean=True):
    """Write a set of entities - given as dicts - to the index."""
    # This is called mainly by the /api/2/collections/X/_bulk API.
    aggregator = get_aggregator(collection)
    writer = aggregator.bulk()
    for data in entities:
        entity = model.get_proxy(data, cleaned=(not clean))
        entity = collection.ns.apply(entity)
        if entity.id is None:
            raise InvalidData("No ID for entity", errors=entity.to_dict())
        if safe:
            entity = remove_checksums(entity)
        entity.context = {"role_id": role_id, "mutable": mutable}
        for field, func in (("created_at", min), ("updated_at", max)):
            ts = func(ensure_list(data.get(field)), default=None)
            dt = registry.date.to_datetime(ts)
            if dt is not None:
                entity.context[field] = dt.isoformat()
        writer.put(entity, origin="bulk")
        yield entity.id
    writer.flush()
