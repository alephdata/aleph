import six
import time
import logging
from elasticsearch.helpers import scan, BulkIndexError

from aleph.core import es, es_index
from aleph.index.mapping import TYPE_RECORD
from aleph.index.util import bulk_op
from aleph.text import index_form

log = logging.getLogger(__name__)


def generate_deletes(document_id):
    q = {
        'query': {'term': {'document_id': document_id}},
        '_source': False
    }
    for res in scan(es, query=q, index=es_index,
                    doc_type=[TYPE_RECORD]):
        yield {
            '_op_type': 'delete',
            '_index': six.text_type(es_index),
            '_type': res.get('_type'),
            '_id': res.get('_id')
        }


def clear_records(document_id):
    """Delete all records associated with the given document."""
    while True:
        try:
            bulk_op(generate_deletes(document_id))
            break
        except BulkIndexError as exc:
            log.warning('Clear records error: %s', exc)
            time.sleep(10)


def generate_records(document):
    """Generate index records, based on document rows or pages."""
    for record in document.records.yield_per(1000):
        texts = [record.text]
        if record.data is not None:
            texts.extend(record.data.values())

        yield {
            '_id': record.id,
            '_type': TYPE_RECORD,
            '_index': six.text_type(es_index),
            '_source': {
                'document_id': document.id,
                'collection_id': document.collection_id,
                'index': record.index,
                'sheet': record.sheet,
                'text': index_form(texts)
            }
        }


def index_records(document):
    clear_records(document.id)
    while True:
        try:
            bulk_op(generate_records(document))
            break
        except BulkIndexError as exc:
            log.warning('Indexing error: %s', exc)
            time.sleep(10)
