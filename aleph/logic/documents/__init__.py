import logging

from aleph.index import documents as index
from aleph.logic.entities import refresh_entity
from aleph.logic.notifications import flush_notifications
from aleph.logic.documents.ingest import ingest, ingest_document  # noqa

log = logging.getLogger(__name__)


def update_document(document, shallow=False, sync=False):
    # These are operations that should be executed after each
    # write to a document or its metadata.
    refresh_entity(document, sync=sync)
    return index.index_document(document, shallow=shallow, sync=sync)


def _delete_document(document, deleted_at=None, sync=False):
    for child in document.children:
        # TODO: are we likely to hit recursion limits?
        _delete_document(child, deleted_at=deleted_at, sync=sync)
    flush_notifications(document)
    index.delete_document(document.id, sync=sync)
    document.delete(deleted_at=deleted_at)


def delete_document(document, deleted_at=None, sync=False):
    refresh_entity(document, sync=sync)
    _delete_document(document, deleted_at=deleted_at, sync=sync)
