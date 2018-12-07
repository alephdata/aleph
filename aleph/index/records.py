import logging
from elasticsearch.helpers import scan, bulk

from aleph.core import db, es
from aleph.model import DocumentRecord
from aleph.index.indexes import records_read_index, records_write_index
from aleph.index.util import query_delete, index_form, unpack_result
from aleph.index.util import MAX_PAGE, TIMEOUT, REQUEST_TIMEOUT

log = logging.getLogger(__name__)


def delete_records(document_id=None, collection_id=None, sync=False):
    """Delete all records associated with the given document."""
    q = {'term': {'document_id': document_id}}
    if collection_id is not None:
        q = {'term': {'collection_id': collection_id}}
    query_delete(records_read_index(), q, refresh=sync)


def generate_records(document):
    """Generate index records, based on document rows or pages."""
    q = db.session.query(DocumentRecord)
    q = q.filter(DocumentRecord.document_id == document.id)
    for idx, record in enumerate(q):
        yield {
            '_id': record.id,
            '_index': records_write_index(),
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


def index_records(document, sync=False):
    if not document.supports_records:
        return
    # TODO: should ``sync`` do anything here?
    return bulk(es, generate_records(document),
                chunk_size=MAX_PAGE,
                max_retries=10,
                initial_backoff=2,
                request_timeout=REQUEST_TIMEOUT,
                timeout=TIMEOUT)


def iter_records(document_id=None, collection_id=None):
    """Scan all records matching the given criteria."""
    filters = []
    if document_id is not None:
        filters.append({'term': {'document_id': document_id}})
    if collection_id is not None:
        filters.append({'term': {'collection_id': collection_id}})
    query = {'query': {'bool': {'filter': filters}}}
    index = records_read_index()
    for res in scan(es, index=index, query=query, scroll='1410m'):
        record = unpack_result(res)
        if record is not None:
            yield record
