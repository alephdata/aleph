import logging
from pprint import pprint  # noqa
from banal import ensure_list

from aleph.core import db
from aleph.model import DocumentRecord, Document
from aleph.index.entities import index_operation
from aleph.index.indexes import entities_read_index
from aleph.index.util import query_delete, bulk_actions

log = logging.getLogger(__name__)


def index_document(document, shallow=False, sync=False):
    log.info("Index document [%s]: %s", document.id, document.name)
    bulk_actions(generate_document(document), sync=sync)


def delete_document(document_id, sync=False):
    """Delete all records associated with the given document."""
    q = {'term': {'document_id': document_id}}
    schemata = (DocumentRecord.SCHEMA_PAGE,
                DocumentRecord.SCHEMA_ROW,
                Document.SCHEMA)
    query_delete(entities_read_index(schemata), q, sync=sync)


def generate_document(document):
    data = document.to_dict()
    data['text'] = ensure_list(data.get('text'))
    if document.supports_records:
        q = db.session.query(DocumentRecord)
        q = q.filter(DocumentRecord.document_id == document.id)
        for idx, record in enumerate(q):
            texts = list(record.texts)
            data['text'].extend(texts)
            record = record.to_dict()
            record['collection_id'] = document.collection_id
            record['created_at'] = document.created_at
            record['updated_at'] = document.updated_at
            record['text'] = texts
            entity_id, index, body = index_operation(record)
            yield {
                '_id': entity_id,
                '_index': index,
                '_type': 'doc',
                '_source': body
            }
            if idx > 0 and idx % 1000 == 0:
                log.info("Indexed [%s]: %s records...", document.id, idx)

    entity_id, index, body = index_operation(data)
    yield {
        '_id': entity_id,
        '_index': index,
        '_type': 'doc',
        '_source': body
    }
