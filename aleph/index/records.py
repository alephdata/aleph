import six
import time
import logging
from elasticsearch.helpers import BulkIndexError

from aleph.core import es_index, db
from aleph.index.mapping import TYPE_RECORD
from aleph.model import DocumentRecord
from aleph.index.util import bulk_op, query_delete
from aleph.text import index_form

log = logging.getLogger(__name__)


def clear_records(document_id):
    """Delete all records associated with the given document."""
    q = {'term': {'document_id': document_id}}
    query_delete(q, doc_type=TYPE_RECORD)


def generate_records(document):
    """Generate index records, based on document rows or pages."""
    q = db.session.query(DocumentRecord)
    q = q.filter(DocumentRecord.document_id == document.id)
    for record in q.yield_per(1000):
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
            return
        except BulkIndexError as exc:
            log.warning('Indexing error: %s', exc)
            time.sleep(10)
