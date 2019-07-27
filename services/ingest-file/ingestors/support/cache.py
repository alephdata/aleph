import logging
from banal import ensure_list

from servicelayer.cache import make_key
from servicelayer.settings import REDIS_LONG

log = logging.getLogger(__name__)


class CacheSupport(object):

    def cache_key(self, *parts):
        return make_key('ingest', *parts)

    def get_conn(self):
        return self.manager.stage.conn

    def get_cache_value(self, key):
        return self.manager.stage.conn.get(key)

    def get_cache_set(self, key):
        return ensure_list(self.manager.stage.conn.smembers(key))

    def set_cache_value(self, key, value):
        if value is None:
            value = ''
        return self.manager.stage.conn.set(key, value, ex=REDIS_LONG)

    def add_cache_set(self, key, value):
        self.manager.stage.conn.sadd(key, value)
        self.manager.stage.conn.expire(key, REDIS_LONG)
