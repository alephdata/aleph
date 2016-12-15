import six
import logging
from hashlib import sha1
from elasticsearch.exceptions import NotFoundError
from elasticsearch.helpers import bulk, scan

from aleph.core import es, es_index
from aleph.model import Document
from aleph.text import latinize_text, string_value
from aleph.index.mapping import TYPE_RECORD

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
                    '_parent': res.get('_parent'),
                    '_type': res.get('_type'),
                    '_retry_on_conflict': 3,
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
            tid = sha1(str(document.id))
            tid.update(str(page.id))
            tid = tid.hexdigest()

            text = string_value(page.text)
            latin = latinize_text(text)

            yield {
                '_id': tid,
                '_type': TYPE_RECORD,
                '_index': six.text_type(es_index),
                '_parent': document.id,
                '_retry_on_conflict': 3,
                '_source': {
                    'type': 'page',
                    'content_hash': document.content_hash,
                    'document_id': document.id,
                    'collection_id': document.collection_id,
                    'page': page.number,
                    'text': text,
                    'text_latin': latin
                }
            }
    elif document.type == Document.TYPE_TABULAR:
        for record in document.records:
            data = {k: string_value(v) for (k, v) in record.data.items()}

            text = [v for v in data.values() if v is not None]
            latin = [latinize_text(t) for t in text]
            latin = [t for t in latin if t not in text]

            yield {
                '_id': record.tid,
                '_type': TYPE_RECORD,
                '_index': six.text_type(es_index),
                '_parent': document.id,
                '_retry_on_conflict': 3,
                '_source': {
                    'type': 'row',
                    'content_hash': document.content_hash,
                    'document_id': document.id,
                    'collection_id': document.collection_id,
                    'row_id': record.row_id,
                    'sheet': record.sheet,
                    'text': text,
                    'text_latin': latin,
                    'raw': data
                }
            }
