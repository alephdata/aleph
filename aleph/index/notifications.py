import logging
from pprint import pprint  # noqa
from datetime import datetime
from servicelayer.cache import make_key
from followthemoney.util import get_entity_id

from aleph.core import settings
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


def index_notification(event, actor_id, params, channels, sync=False):
    """Index a notification."""
    params = params or {}
    params = {n: get_entity_id(params.get(n)) for n in event.params.keys()}
    channels = list(set([c for c in channels if c is not None]))
    data = {
        'actor_id': actor_id,
        'params': params,
        'event': event.name,
        'channels': channels,
        'created_at': datetime.utcnow(),
    }
    index = notifications_index()
    keys = [':'.join(i) for i in params.items()]
    id_ = make_key(actor_id, event.name, *channels, *keys)
    return index_safe(index, id_, data, refresh=refresh_sync(sync))


def delete_notifications(channel, sync=False):
    """Delete entities from a collection."""
    filters = [{'term': {'channels': channel}}]
    query = {'bool': {'filter': filters}}
    query_delete(notifications_index(), query, sync=sync)
