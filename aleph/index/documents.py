import logging
from pprint import pprint  # noqa

from aleph.index.records import index_records, delete_records
from aleph.index.entities import delete_entity, index_single

log = logging.getLogger(__name__)


def index_document(document, shallow=False, sync=False):
    log.info("Index document [%s]: %s", document.id, document.name)
    proxy = document.to_proxy()
    context = {
        'status': document.status,
        'content_hash': document.content_hash,
        'foreign_id': document.foreign_id,
        'error_message': document.error_message,
        'uploader_id': document.uploader_id,
    }
    texts = list(document.texts)
    if not shallow:
        index_records(document, sync=False)
    return index_single(document, proxy, context, texts, sync=sync)


def delete_document(document_id, sync=False):
    delete_records(document_id=document_id, sync=False)
    delete_entity(document_id, sync=sync)
