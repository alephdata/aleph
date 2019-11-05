import logging

from flask import request
from werkzeug.exceptions import BadRequest
from followthemoney import model
from followthemoney.namespace import Namespace
from banal import hash_data, keys_values

from aleph.core import archive, db
from aleph.views.util import get_index_entity, get_session_id
from aleph.views.serializers import first
from aleph.logic.aggregator import get_aggregator
from aleph.logic.collections import refresh_collection
from aleph.queues import queue_task, OP_INDEX, OP_BULKDELETE, OP_BULKLOAD
from aleph.model import Mapping


log = logging.getLogger(__name__)


def load_query():
    try:
        query = request.json.get('mapping_query', '{}')
        # just for validation
        model.make_mapping({'entities': query})
    except Exception as ex:
        raise BadRequest(ex)
    return query


def get_mapping_query(mapping):
    table = get_index_entity(mapping.table_id, request.authz.READ)
    properties = table.get('properties', {})
    csv_hash = first(properties.get('csvHash'))
    query = {
        'entities': mapping.query,
        'proof_id': mapping.table_id,
    }
    url = None
    if csv_hash:
        url = archive.generate_url(csv_hash)
        if not url:
            local_path = archive.load_file(csv_hash)
            if local_path is not None:
                url = local_path.as_posix()
        if url is not None:
            query['csv_url'] = url
            return {
                'query': query,
                'mapping_id': mapping.id,
            }
        raise BadRequest("Could not generate csv url for the table")
    raise BadRequest("Source table doesn't have a csvHash")


def bulk_load(stage, collection, config):
    """Bulk load entities from a CSV file or SQL database.

    This is done by mapping the rows in the source data to entities and links
    which can be understood by the entity index.
    """
    queries = keys_values(config, 'queries', 'query')
    mapping_id = config.get('mapping_id')
    mapping = Mapping.by_id(mapping_id)
    config['entity_ids'] = []
    for query in queries:
        try:
            entity_ids = load_mapping_query(stage, collection, hash_data(query), query)  # noqa
            config['entity_ids'].extend(entity_ids)
        except Exception as exc:
            if mapping:
                mapping.set_status(stage.job.id, status=Mapping.FAILED, error=str(exc))  # noqa
            else:
                raise exc
        else:
            if mapping:
                mapping.set_status(stage.job.id, status=Mapping.SUCCESS)
    queue_task(collection, OP_INDEX, job_id=stage.job.id, payload=config)


def load_mapping_query(stage, collection, query_id, query):
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


def flush_mapping(collection, mapping):
    job_id = get_session_id()
    payload = {
        'mapping_id': mapping.id,
    }
    queue_task(collection, OP_BULKDELETE, job_id=job_id, payload=payload)
    collection.touch()
    db.session.commit()
    refresh_collection(collection.id)


def load_mapping(collection, mapping):
    query = get_mapping_query(mapping)
    job_id = get_session_id()
    queue_task(collection, OP_BULKLOAD, job_id=job_id, payload=query)
    collection.touch()
    db.session.commit()
    refresh_collection(collection.id)
