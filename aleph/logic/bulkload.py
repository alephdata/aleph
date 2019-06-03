import logging
from banal import hash_data, keys_values
from followthemoney import model
from followthemoney.namespace import Namespace

from aleph.logic.aggregator import get_aggregator
from aleph.queues import get_queue, OP_INDEX

log = logging.getLogger(__name__)


def bulk_load(queue, collection, config):
    """Bulk load entities from a CSV file or SQL database.

    This is done by mapping the rows in the source data to entities and links
    which can be understood by the entity index.
    """
    queries = keys_values(config, 'queries', 'query')
    for query in queries:
        bulk_load_query(queue, collection, hash_data(query), query)
    index = get_queue(collection, OP_INDEX)
    index.queue_task({}, {})
    queue.remove()


def bulk_load_query(queue, collection, query_id, query):
    namespace = Namespace(collection.foreign_id)
    mapping = model.make_mapping(query, key_prefix=collection.foreign_id)
    records_total = len(mapping.source)
    if records_total:
        queue.progress.mark_pending(records_total)
    aggregator = get_aggregator(collection)
    writer = aggregator.bulk()
    entities_count = 0
    for idx, record in enumerate(mapping.source.records, 1):
        for entity in mapping.map(record).values():
            entity = namespace.apply(entity)
            entities_count += 1
            fragment = '%s-%s' % (query_id, idx)
            writer.put(entity, fragment=fragment)

        if idx > 0 and idx % 1000 == 0:
            queue.progress.mark_finished(1000)
            log.info("[%s] Loaded %s records (%s), %s entities...",
                     collection.foreign_id,
                     idx,
                     records_total or 'streaming',
                     entities_count)
    writer.flush()
    aggregator.close()
    log.info("[%s] Query done (%s entities)",
             collection.foreign_id, entities_count)
