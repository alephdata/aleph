import logging
from elasticsearch.helpers import bulk

from aleph.core import get_es, get_es_index

log = logging.getLogger(__name__)


def bulk_op(iter):
    try:
        bulk(get_es(), iter, stats_only=True, chunk_size=1000,
             request_timeout=120.0)
    except Exception as ex:
        log.debug("Bulk operation failed: %r", ex)


def flush_es():
    """Run a refresh to apply all indexing changes."""
    get_es().indices.refresh(index=get_es_index())
