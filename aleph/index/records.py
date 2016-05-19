import logging
from hashlib import sha1
from elasticsearch.helpers import bulk, scan

from aleph.core import get_es, get_es_index
from aleph.model import Document
from aleph.text import latinize_text
from aleph.index.mapping import TYPE_RECORD

log = logging.getLogger(__name__)


def clear_records(document):
    """Delete all records associated with the given document."""
    q = {'query': {'term': {'document_id': document.id}},
         '_source': False}

    def gen_deletes():
            for res in scan(get_es(), query=q, index=get_es_index(),
                            doc_type=[TYPE_RECORD]):
                yield {
                    '_op_type': 'delete',
                    '_index': get_es_index(),
                    '_parent': res.get('_parent'),
                    '_type': res.get('_type'),
                    '_id': res.get('_id')
                }

    try:
        bulk(get_es(), gen_deletes(), stats_only=True, chunk_size=2000,
             request_timeout=600.0)
    except Exception:
        log.debug("Failed to clear previous index: %r", document)


def generate_records(document):
    if document.type == Document.TYPE_TEXT:
        for page in document.pages:
            tid = sha1(str(document.id))
            tid.update(str(page.id))
            tid = tid.hexdigest()
            yield {
                '_id': tid,
                '_type': TYPE_RECORD,
                '_index': get_es_index(),
                '_parent': document.id,
                '_source': {
                    'type': 'page',
                    'content_hash': document.content_hash,
                    'document_id': document.id,
                    'source_id': document.source_id,
                    'page': page.number,
                    'text': page.text,
                    'text_latin': latinize_text(page.text)
                }
            }
    elif document.type == Document.TYPE_TABULAR:
        for record in document.records:
            text = record.text
            latin = [latinize_text(t) for t in text]
            latin = [t for t in latin if t not in text]
            yield {
                '_id': record.tid,
                '_type': TYPE_RECORD,
                '_index': get_es_index(),
                '_parent': document.id,
                '_source': {
                    'type': 'row',
                    'content_hash': document.content_hash,
                    'document_id': document.id,
                    'source_id': document.source_id,
                    'row_id': record.row_id,
                    'sheet': record.sheet,
                    'text': text,
                    'text_latin': latin,
                    'raw': record.data
                }
            }
