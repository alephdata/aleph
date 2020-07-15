import logging
from datetime import datetime
from banal import is_mapping, ensure_list
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.helpers import remove_checksums

from aleph.logic.collections import index_aggregator, refresh_collection
from aleph.logic.aggregator import get_aggregator
from aleph.index.util import MAX_PAGE

log = logging.getLogger(__name__)


def index_many(stage, collection, sync=False, entity_ids=None, batch=100):
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


def bulk_write(collection, entities, unsafe=False, role_id=None, index=True):
    """Write a set of entities - given as dicts - to the index."""
    # This is called mainly by the /api/2/collections/X/_bulk API.
    now = datetime.utcnow().isoformat()
    aggregator = get_aggregator(collection)
    writer = aggregator.bulk()
    entity_ids = set()
    for data in entities:
        if not is_mapping(data):
            raise InvalidData("Failed to read input data", errors=data)
        entity = model.get_proxy(data)
        if entity.id is None:
            raise InvalidData("No ID for entity", errors=entity.to_dict())
        entity = collection.ns.apply(entity)
        if not unsafe:
            entity = remove_checksums(entity)
        entity.context = {
            "role_id": role_id,
            "created_at": now,
            "updated_at": now,
        }
        writer.put(entity, origin="bulk")
        if index and len(entity_ids) < MAX_PAGE:
            entity_ids.add(entity.id)
    writer.flush()
    if index:
        if len(entity_ids) >= MAX_PAGE:
            entity_ids = None
        index_aggregator(collection, aggregator, entity_ids=entity_ids)
        refresh_collection(collection.id)
