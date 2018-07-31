import logging
from itertools import count

from aleph.core import db
from aleph.model import DocumentRecord
from aleph.index.core import record_index, records_index
from aleph.index.util import query_delete, index_form, refresh_index
from aleph.index.util import bulk_op, backoff_cluster

log = logging.getLogger(__name__)


def clear_records(document_id):
    """Delete all records associated with the given document."""
    q = {'term': {'document_id': document_id}}
    query_delete(records_index(), q)


def generate_records(document):
    """Generate index records, based on document rows or pages."""
    q = db.session.query(DocumentRecord)
    q = q.filter(DocumentRecord.document_id == document.id)
    for idx, record in enumerate(q):
        yield {
            '_id': record.id,
            '_index': record_index(),
            '_type': 'doc',
            '_source': {
                'document_id': document.id,
                'collection_id': document.collection_id,
                'index': record.index,
                'text': index_form(record.texts)
            }
        }
        if idx > 0 and idx % 1000 == 0:
            log.info("Indexed [%s]: %s records...", document.id, idx)


def index_records(document):
    if not document.supports_records:
        return

    clear_records(document.id)
    for attempt in count():
        try:
            bulk_op(generate_records(document))
            refresh_index(index=records_index())
            return
        except Exception as exc:
            log.warning('Failed to index records: %s', exc)
        backoff_cluster(failures=attempt)
