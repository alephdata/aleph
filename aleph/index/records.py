import six
import time
import logging
from normality import stringify
from elasticsearch.helpers import scan, BulkIndexError

from aleph.core import es, es_index
from aleph.model import Document
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
    if document.type == Document.TYPE_TEXT:
        for page in document.pages:
            yield {
                '_id': page.tid,
                '_type': TYPE_RECORD,
                '_index': six.text_type(es_index),
                '_source': {
                    'type': 'page',
                    'document_id': document.id,
                    'collection_id': document.collection_id,
                    'page': page.number,
                    'text': index_form([page.text])
                }
            }
    elif document.type == Document.TYPE_TABULAR:
        for record in document.records:
            data = {k: stringify(v) for (k, v) in record.data.items()}
            yield {
                '_id': record.tid,
                '_type': TYPE_RECORD,
                '_index': six.text_type(es_index),
                '_source': {
                    'type': 'row',
                    'document_id': document.id,
                    'collection_id': document.collection_id,
                    'row_id': record.row_id,
                    'sheet': record.sheet,
                    'text': index_form(data.values()),
                    'raw': data
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
