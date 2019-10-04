import logging
from banal import hash_data, keys_values
from followthemoney import model
from followthemoney.namespace import Namespace

from aleph.logic.aggregator import get_aggregator
from aleph.queues import queue_task, OP_INDEX

log = logging.getLogger(__name__)


def bulk_load(stage, collection, config):
    """Bulk load entities from a CSV file or SQL database.

    This is done by mapping the rows in the source data to entities and links
    which can be understood by the entity index.
    """
    queries = keys_values(config, 'queries', 'query')
    config['entity_ids'] = []
    for query in queries:
        entity_ids = bulk_load_query(stage, collection, hash_data(query), query)  # noqa
        config['entity_ids'].extend(entity_ids)
    queue_task(collection, OP_INDEX, job_id=stage.job.id, payload=config)


def bulk_load_query(stage, collection, query_id, query):
    namespace = Namespace(collection.foreign_id)
    mapping = model.make_mapping(query, key_prefix=collection.foreign_id)
    aggregator = get_aggregator(collection)
    writer = aggregator.bulk()
    entities_count = 0
    proof_id = query.pop('proof_id', None)
    entity_ids = []
    for idx, record in enumerate(mapping.source.records, 1):
        for entity in mapping.map(record).values():
            if entity.schema.is_a('Thing'):
                entity.add('proof', proof_id)
            entity = namespace.apply(entity)
            entity_ids.append(entity.id)
            entities_count += 1
            fragment = '%s-%s' % (query_id, idx)
            writer.put(entity, fragment=fragment)

        if idx > 0 and idx % 1000 == 0:
            stage.report_finished(1000)
            log.info("[%s] Loaded %s records, %s entities...",
                     collection.foreign_id,
                     idx, entities_count)
    writer.flush()
    aggregator.close()
    log.info("[%s] Query done (%s entities)",
             collection.foreign_id, entities_count)
    return entity_ids
