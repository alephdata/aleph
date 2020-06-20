import logging
from banal import ensure_list

from servicelayer.tags import Tags
from servicelayer.cache import make_key
from servicelayer.settings import REDIS_LONG

log = logging.getLogger(__name__)


class CacheSupport(object):

    @property
    def tags(self):
        if not hasattr(CacheSupport, '_tags'):
            CacheSupport._tags = Tags('ingest_cache')
        return CacheSupport._tags

    def cache_key(self, *parts):
        return make_key(*parts)

    def get_cache_set(self, key):
        return ensure_list(self.manager.stage.conn.smembers(key))

    def add_cache_set(self, key, value):
        self.manager.stage.conn.sadd(key, value)
        self.manager.stage.conn.expire(key, REDIS_LONG)
