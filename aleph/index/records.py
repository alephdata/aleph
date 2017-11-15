import time
import logging
from elasticsearch.helpers import BulkIndexError

from aleph.core import db
from aleph.model import DocumentRecord
from aleph.index.core import record_type, record_index, records_index
from aleph.index.util import bulk_op, query_delete, index_form

log = logging.getLogger(__name__)


def clear_records(document_id):
    """Delete all records associated with the given document."""
    q = {'term': {'document_id': document_id}}
    query_delete(records_index(), q)


def generate_records(document):
    """Generate index records, based on document rows or pages."""
    q = db.session.query(DocumentRecord)
    q = q.filter(DocumentRecord.document_id == document.id)
    for record in q:
        yield {
            '_id': record.id,
            '_index': record_index(),
            '_type': record_type(),
            '_source': {
                'document_id': document.id,
                'collection_id': document.collection_id,
                'index': record.index,
                'sheet': record.sheet,
                'text': index_form(record.texts)
            }
        }


def index_records(document):
    if not document.has_records():
        return

    clear_records(document.id)
    while True:
        try:
            bulk_op(generate_records(document))
            return
        except BulkIndexError as exc:
            log.warning('Indexing error: %s', exc)
            time.sleep(10)
