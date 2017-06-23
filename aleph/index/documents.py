import logging

from aleph.core import celery, es, es_index
from aleph.model import Document
from aleph.index.records import index_records, clear_records
from aleph.index.mapping import TYPE_DOCUMENT
from aleph.index.util import index_form

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
    if document.status == Document.STATUS_PENDING:
        return

    # FIXME:
    if document.type == Document.TYPE_OTHER:
        return

    log.info("Index document [%s]: %s", document.id, document.title)
    data = document.to_dict()
    if document.parent_id is not None:
        data['parent'] = {
            'id': document.parent_id,
            'type': document.parent.type,
            'title': document.parent.title,
        }
    data['text'] = index_form(document.text_parts())
    data['text'].extend(index_form([data.get('title'),
                                    data.get('summary')]))
    data['schema'] = document.SCHEMA
    data['schemata'] = [document.SCHEMA]
    data['$children'] = document.children.count()
    data['name_sort'] = data.get('title')
    data['roles'] = document.collection.roles
    data.pop('tables')
    data.pop('headers')

    es.index(index=es_index,
             doc_type=TYPE_DOCUMENT,
             body=data,
             id=document.id)


def delete_document(document_id):
    clear_records(document_id)
    es.delete(index=es_index,
              doc_type=TYPE_DOCUMENT,
              id=document_id,
              ignore=[404])
