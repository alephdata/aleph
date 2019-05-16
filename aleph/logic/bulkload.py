import logging
from banal import keys_values
from followthemoney import model
from followthemoney.namespace import Namespace

from aleph.logic.aggregator import get_aggregator
from aleph.queue import get_queue, OP_INDEX

log = logging.getLogger(__name__)


def bulk_load(queue, collection, config):
    """Bulk load entities from a CSV file or SQL database.

    This is done by mapping the rows in the source data to entities and links
    which can be understood by the entity index.
    """
    queries = keys_values(config, 'queries', 'query')
    for query_id, query in enumerate(queries):
        bulk_load_query(queue, collection, query_id, query)
    index = get_queue(collection, OP_INDEX)
    index.queue_task({}, {})
    queue.remove()


def bulk_load_query(queue, collection, query_id, query):
    namespace = Namespace(collection.foreign_id)
    mapping = model.make_mapping(query, key_prefix=collection.foreign_id)
    records_total = len(mapping.source) or 'streaming'
    aggregator = get_aggregator(collection)
    writer = aggregator.bulk()
    entities_count = 0
    for records_index, record in enumerate(mapping.source.records, 1):
        for entity in mapping.map(record).values():
            fragment = 'q%se%s' % (query_id, record)
            entity = namespace.apply(entity)
            entities_count += 1
            writer.put(entity, fragment=fragment)

        if records_index > 0 and records_index % 1000 == 0:
            log.info("[%s] Loaded %s records (%s), %s entities...",
                     collection.foreign_id,
                     records_index,
                     records_total,
                     entities_count)
    writer.flush()
    aggregator.close()
