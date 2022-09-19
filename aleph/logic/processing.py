import logging
from typing import List

from banal import ensure_list
from followthemoney import model
from followthemoney.types import registry
from followthemoney.exc import InvalidData
from followthemoney.helpers import remove_checksums
from servicelayer.taskqueue import Task

from aleph.logic.collections import index_aggregator, refresh_collection
from aleph.logic.aggregator import get_aggregator

log = logging.getLogger(__name__)


def index_many(collection, tasks: List[Task], sync=False):
    """Project the contents of the collections aggregator into the index."""
    entity_ids = []
    for task in tasks:
        entity_ids.extend(ensure_list(task.payload.get("entity_ids")))
    aggregator = get_aggregator(collection)
    index_aggregator(collection, aggregator, entity_ids=entity_ids, sync=sync)
    refresh_collection(collection.id)


def bulk_write(collection, entities, safe=False, role_id=None, mutable=True):
    """Write a set of entities - given as dicts - to the index."""
    # This is called mainly by the /api/2/collections/X/_bulk API.
    aggregator = get_aggregator(collection)
    writer = aggregator.bulk()
    for data in entities:
        entity = model.get_proxy(data, cleaned=False)
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
