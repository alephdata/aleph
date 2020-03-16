import logging

from servicelayer.cache import make_key

from aleph.core import es
from aleph.index.indexes import reports_index
from aleph.index.util import query_delete, bulk_actions, field_filter_query


log = logging.getLogger(__name__)


def get_report_id(payload):
    return make_key(payload['operation'], payload['dataset'], payload['job'], payload['entity']['id'])


def clean_report_payload(payload, collection):
    """sign entity ids, get name as extra field"""
    entity = payload['entity']

    entity_name = entity.get('properties', {}).get('fileName')
    if entity_name is None:
        entity_name = entity.get('schema')
        if entity_name is None:
            entity_name = entity['id']
    payload['entity_name'] = entity_name

    entity['id'] = collection.ns.sign(entity['id'])
    payload['entity'] = entity
    payload['collection_id'] = collection.id

    return payload


def serialize_task_report(task, collection):
    return {
        '_id': get_report_id(task.payload),
        '_index': reports_index(),
        '_op_type': 'update',
        'doc': clean_report_payload(task.payload, collection),
        'doc_as_upsert': True
    }


def index_bulk(tasks, collection, sync=False):
    tasks = (serialize_task_report(t, collection) for t in tasks)
    bulk_actions(tasks, sync=sync)


def delete_job_report(job_id, sync=False):
    """Delete all task reports for a given job"""
    query = {'bool': {'filter': [field_filter_query('job', str(job_id))]}}
    query_delete(reports_index(), query, sync)
    log.info("Deleted Job report [%s]" % job_id)


def delete_collection_report(foreign_id, sync=False):
    """Delete all task reports for a given collection"""
    query = {'bool': {'filter': [field_filter_query('dataset', foreign_id)]}}
    query_delete(reports_index(), query, sync)
    log.info("Deleted Collection report [%s]" % foreign_id)


def get_document_processing_report(document):
    entity_id, job_id = document['id'], document['job_id']
    index = reports_index()
    query = {'query': {'bool': {'filter': [
        field_filter_query('entity.id', entity_id),
        field_filter_query('job', job_id),
    ]}}}
    res = es.search(index=index, body=query)
    return res


def get_collection_processing_report(collection_id):
    index = reports_index()
    query = {'query': {'term': {'collection_id': collection_id}}, 'size': 0}
    time_range_agg = {
        'start_at': {'min': {'field': 'start_at'}},
        'updated_at': {'max': {'field': 'updated_at'}}
    }
    status_agg = {**{'status': {'terms': {'field': 'status'}}}, **time_range_agg}
    query['aggs'] = {
        'jobs': {
            'terms': {'field': 'job', 'size': 1000},
            'aggs': {
                'errors': {
                    'terms': {'field': 'has_error'},
                    'aggs': {
                        'entities': {
                            'terms': {'field': 'entity', 'size': 1000}
                        }
                    }
                },
                'operations': {
                    'terms': {'field': 'operation'},
                    'aggs': status_agg
                },
                **status_agg
            }
        }
    }
    res = es.search(index=index, body=query)
    return res
