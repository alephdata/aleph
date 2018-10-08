import logging
from pprint import pprint  # noqa

from aleph.core import celery
from aleph.model import Document
from aleph.index.records import index_records, clear_records
from aleph.index.entities import delete_entity, index_single

log = logging.getLogger(__name__)


@celery.task()
def index_document_id(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    index_document(document)
    index_records(document)


def index_document(document):
    name = document.name
    log.info("Index document [%s]: %s", document.id, name)
    data = document.to_schema_entity()
    data.update({
        'status': document.status,
        'content_hash': document.content_hash,
        'foreign_id': document.foreign_id,
        'error_message': document.error_message,
        'uploader_id': document.uploader_id,
        'title': document.title,
        'name': name,
        'summary': document.summary,
        'author': document.author,
        'generator': document.generator,
        'file_size': document.file_size,
        'file_name': document.file_name,
        'source_url': document.source_url,
        'languages': document.languages,
        'countries': document.countries,
        'keywords': document.keywords,
        'date': document.date,
        'authored_at': document.authored_at,
        'modified_at': document.modified_at,
        'published_at': document.published_at,
        'retrieved_at': document.retrieved_at,
        'dates': document.dates,
        'extension': document.extension,
        'encoding': document.encoding,
        'mime_type': document.mime_type,
        'pdf_version': document.pdf_version,
        'columns': document.columns,
        'ancestors': document.ancestors,
        'children': document.children.count()
    })

    texts = list(document.texts)
    texts.extend(document.columns)

    parent = document.parent
    if parent is not None:
        texts.append(parent.title)
        data['parent'] = {
            'id': parent.id,
            'schema': parent.schema,
            'title': parent.title,
        }

    return index_single(document, data, texts)


def delete_document(document_id):
    clear_records(document_id)
    delete_entity(document_id)
