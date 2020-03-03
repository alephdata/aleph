import logging

from servicelayer.cache import make_key

from aleph.core import es
from aleph.index.indexes import reports_index
from aleph.index.util import query_delete, bulk_actions, field_filter_query


log = logging.getLogger(__name__)


def get_report_id(payload):
    return make_key(payload['stage'], payload['dataset'], payload['job'], payload['entity']['id'])


def serialize_task_report(task):
    return {
        '_id': get_report_id(task.payload),
        '_index': reports_index(),
        '_op_type': 'update',
        'doc': task.payload,
        'doc_as_upsert': True
    }


def index_bulk(tasks, sync=False):
    tasks = (serialize_task_report(t) for t in tasks)
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


def get_collection_processing_report(foreign_id):
    index = reports_index()
    query = {'query': {'term': {'dataset': foreign_id}}, 'size': 0}
    time_range_agg = {
        'start_at': {'min': {'field': 'start_at'}},
        'end_at': {'max': {'field': 'end_at'}},
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
                'stages': {
                    'terms': {'field': 'stage'},
                    'aggs': status_agg
                },
                **status_agg
            }
        }
    }
    res = es.search(index=index, body=query)
    return res
