import json
import logging
from apikit.jsonify import JSONEncoder
from elasticsearch.helpers import bulk

from aleph.core import get_es

log = logging.getLogger(__name__)


def expand_json(data):
    data = JSONEncoder().encode(data)
    return json.loads(data)


def bulk_op(iter):
    try:
        bulk(get_es(), iter, stats_only=True, chunk_size=1000,
             request_timeout=220.0)
    except Exception as ex:
        log.debug("Bulk operation failed: %r", ex)
