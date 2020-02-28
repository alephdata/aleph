import logging
from uuid import uuid4
from pprint import pprint  # noqa
from datetime import datetime

from aleph.core import es, cache, settings
from aleph.model import Entity, Collection
from aleph.index.indexes import entities_read_index
from aleph.index.util import index_name, index_settings, configure_index
from aleph.index.util import query_delete, index_safe, refresh_sync
from aleph.index.util import KEYWORD

log = logging.getLogger(__name__)


def notifications_index():
    return index_name('notifications', settings.INDEX_WRITE)


def configure_notifications():
    mapping = {
        "date_detection": False,
        "dynamic": False,
        "properties": {
            "event": KEYWORD,
            "actor_id": KEYWORD,
            "channels": KEYWORD,
            "created_at": {"type": "date"},
            "params": {
                "dynamic": True,
                "type": "object"
            }
        }
    }
    index = notifications_index()
    settings = index_settings(shards=3)
    return configure_index(index, mapping, settings)


def index_notification(event, actor_id=None, params=None,
                       channels=None, sync=False):
    """Index a notification."""
    data = {
        'actor_id': actor_id,
        'params': params,
        'event': event,
        'channels': channels,
        'created_at': datetime.utcnow(),
    }
    index = notifications_index()
    return index_safe(index, uuid4().hex, data, refresh=refresh_sync(sync))


def get_notifications(role, channels, since=None):
    query = {'term': {'collection_id': collection_id}}
    query = {
        'size': 0,
        'from': 0,
        'query': {'bool': {'filter': [query]}},
        'aggs': {
            'values': {'terms': {'field': facet, 'size': 300}},
            'total': {'cardinality': {'field': facet}}
        }
    }
    index = entities_read_index(schema=Entity.THING)
    result = es.search(index=index,
                       body=query,
                       request_timeout=3600,
                       timeout='20m')
    aggregations = result.get('aggregations')
    values = {}
    for bucket in aggregations.get('values').get('buckets', []):
        values[bucket['key']] = bucket['doc_count']
    data = {
        'values': values,
        'total': aggregations.get('total').get('value', 0)
    }
    cache.set_complex(key, data, expires=cache.EXPIRE)
    return data


def delete_notifications(channel, sync=False):
    """Delete entities from a collection."""
    filters = [{'term': {'channels': channel}}]
    query = {'bool': {'filter': filters}}
    query_delete(notifications_index(), query, sync=sync)
