import logging
from normality import ascii_text, stringify
from elasticsearch.exceptions import NotFoundError

from aleph.core import celery, es, es_index
from aleph.model import Document
from aleph.index.records import generate_records, clear_records
from aleph.index.entities import generate_entities
from aleph.index.mapping import TYPE_DOCUMENT
from aleph.index.util import bulk_op

log = logging.getLogger(__name__)

TEXT_MAX_LEN = 1024 * 1024 * 50


@celery.task()
def index_document_id(document_id, index_records=True):
    document = Document.by_id(document_id)
    if document is None:
        log.info("Could not find document: %r", document_id)
        return
    index_document(document)


def get_text(document):
    """Generate an array with the full text of the given document.

    This will limit document length to TEXT_MAX_LEN in order to avoid
    uploading extremely long documents.
    """
    texts = []
    for text in document.text_parts():
        text = stringify(text)
        texts.append(text)
        latin = ascii_text(text)
        if latin != text:
            texts.append(latin)

        text_len = sum((len(t) for t in texts))
        # First, try getting rid of duplicate entries, which are more likely in
        # tabular documents. If that does not help, partial text will be
        # returned.
        if text_len >= TEXT_MAX_LEN:
            texts = list(set(texts))

            text_len = sum((len(t) for t in texts))
            if text_len >= TEXT_MAX_LEN:
                return texts

    return texts


def index_document(document, index_records=True):
    if document.status == Document.STATUS_PENDING:
        return

    log.info("Index document: %r", document)
    data = document.to_index_dict()
    data['text'] = get_text(document)
    data['entities'] = generate_entities(document)
    data['title_latin'] = ascii_text(data.get('title'))
    data['summary_latin'] = ascii_text(data.get('summary'))
    es.index(index=es_index, doc_type=TYPE_DOCUMENT, body=data, id=document.id)

    if index_records:
        clear_records(document.id)
        bulk_op(generate_records(document))


def delete_document(document_id):
    clear_records(document_id)
    try:
        es.delete(index=es_index, doc_type=TYPE_DOCUMENT, id=document_id)
    except NotFoundError:
        pass
