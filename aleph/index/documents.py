import logging
from pprint import pprint  # noqa
from banal import clean_dict
from followthemoney import model
from followthemoney.types import TYPES

from aleph.core import celery, db, es, es_index
from aleph.model import Document, DocumentTag
from aleph.index.records import index_records, clear_records
from aleph.index.mapping import TYPE_DOCUMENT
from aleph.index.util import index_form, index_names, unpack_result

log = logging.getLogger(__name__)

TAG_FIELDS = {
    DocumentTag.TYPE_EMAIL: TYPES['email'].invert,
    DocumentTag.TYPE_PHONE: TYPES['phone'].invert,
    DocumentTag.TYPE_PERSON: TYPES['name'].invert,
    DocumentTag.TYPE_ORGANIZATION: TYPES['name'].invert
}


@celery.task()
def index_document_id(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    index_document(document)
    index_records(document)


def index_document(document):
    if document.status == Document.STATUS_PENDING:
        return

    log.info("Index document [%s]: %s", document.id, document.title)
    schema = model.get(Document.SCHEMA)
    data = {
        'schema': schema.name,
        'schemata': schema.names,
        'collection_id': document.collection_id,
        'roles': document.collection.roles,
        'type': document.type,
        'status': document.status,
        'content_hash': document.content_hash,
        'foreign_id': document.foreign_id,
        'error_message': document.error_message,
        'uploader_id': document.uploader_id,
        'created_at': document.created_at,
        'updated_at': document.updated_at,
        'title': document.title,
        'name_sort': document.title,
        'summary': document.summary,
        'author': document.author,
        'file_size': document.file_size,
        'file_name': document.file_title,
        'source_url': document.source_url,
        'languages': document.languages,
        'countries': document.countries,
        'keywords': document.keywords,
        'dates': document.dates,
        'extension': document.extension,
        'encoding': document.encoding,
        'mime_type': document.mime_type,
        'pdf_version': document.pdf_version,
        'columns': document.columns,
        '$children': document.children.count(),
        'text': index_form(document.texts)
    }
    if document.parent_id is not None:
        data['parent'] = {
            'id': document.parent_id,
            'type': document.parent.type,
            'title': document.parent.title,
        }

    q = db.session.query(DocumentTag)
    q = q.filter(DocumentTag.document_id == document.id)
    for tag in q.yield_per(5000):
        field = TAG_FIELDS.get(tag.type)
        if field is None:
            log.warning("Cannot index document tag: %r", tag)
            continue
        if field not in data:
            data[field] = []
        data[field].append(tag.text)

    index_names(data)
    data = clean_dict(data)
    # pprint(data)
    es.index(index=es_index,
             doc_type=TYPE_DOCUMENT,
             body=data,
             id=document.id)
    data['id'] = document.id
    data['$type'] = TYPE_DOCUMENT
    return data


def get_document(document_id):
    """Fetch a document from the index."""
    result = es.get(index=es_index,
                    doc_type=TYPE_DOCUMENT,
                    id=document_id,
                    ignore=[404])
    document = unpack_result(result)
    if document is not None:
        document.pop('text', None)
    return document


def delete_document(document_id):
    clear_records(document_id)
    es.delete(index=es_index,
              doc_type=TYPE_DOCUMENT,
              id=document_id,
              ignore=[404])
