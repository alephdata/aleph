import six
import logging
from normality import stringify
from hashlib import sha1
from elasticsearch.exceptions import NotFoundError
from elasticsearch.helpers import bulk, scan

from aleph.core import es, es_index
from aleph.model import Document
from aleph.index.mapping import TYPE_RECORD
from aleph.text import index_form

log = logging.getLogger(__name__)


def clear_records(document_id):
    """Delete all records associated with the given document."""
    q = {
        'query': {
            'term': {'document_id': document_id}
        },
        '_source': False
    }

    def gen_deletes():
            for res in scan(es, query=q, index=es_index,
                            doc_type=[TYPE_RECORD]):
                yield {
                    '_op_type': 'delete',
                    '_index': six.text_type(es_index),
                    '_type': res.get('_type'),
                    '_id': res.get('_id')
                }

    try:
        bulk(es, gen_deletes(), stats_only=True, chunk_size=2000,
             request_timeout=600.0)
    except (Exception, NotFoundError):
        log.debug("Failed to clear previous index: %r", document_id)


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
