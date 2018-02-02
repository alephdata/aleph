from __future__ import absolute_import

import logging
from pprint import pprint  # noqa
from collections import defaultdict

from aleph.core import celery, db
from aleph.model import Document, DocumentTag
from aleph.index.records import index_records, clear_records
from aleph.index.entities import get_entity, delete_entity, index_single

log = logging.getLogger(__name__)


@celery.task()
def index_document_id(document_id):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    index_document(document)
    index_records(document)


def generate_tags(document):
    """Transform document tag objects into normalized tag snippets."""
    tags = defaultdict(set)
    q = db.session.query(DocumentTag)
    q = q.filter(DocumentTag.document_id == document.id)
    q = q.order_by(DocumentTag.weight.desc())
    for tag in q:
        type_ = DocumentTag.TYPES[tag.type]
        values = type_.normalize(tag.text,
                                 cleaned=True,
                                 countries=document.countries)
        tags[tag.field].update(values)

    # pprint(dict(tags))
    return tags.items()


def index_document(document):
    if document.status == Document.STATUS_PENDING:
        return

    log.info("Index document [%s]: %s", document.id, document.title)
    texts = list(document.texts)
    data = {
        'status': document.status,
        'content_hash': document.content_hash,
        'foreign_id': document.foreign_id,
        'error_message': document.error_message,
        'uploader_id': document.uploader_id,
        'title': document.title,
        'name': document.title,
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
    }
    texts.extend(document.columns)

    if document.parent_id is not None:
        texts.append(document.parent.title)
        data['parent'] = {
            'id': document.parent_id,
            'schema': document.parent.schema,
            'title': document.parent.title,
        }

    for (field, values) in generate_tags(document):
        if field not in data:
            data[field] = list(values)
        else:
            data[field].extend(values)

    return index_single(document, data, texts)


def get_document(document_id):
    """Fetch a document from the index."""
    return get_entity(document_id)


def delete_document(document_id):
    clear_records(document_id)
    delete_entity(document_id)
