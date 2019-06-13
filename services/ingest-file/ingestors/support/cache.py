import logging

from servicelayer.cache import make_key
from servicelayer.settings import REDIS_LONG

log = logging.getLogger(__name__)


class CacheSupport(object):

    def cache_key(self, *parts):
        return make_key('ingest', *parts)

    def get_conn(self):
        return self.manager.queue.conn

    def get_cache_value(self, key):
        return self.manager.queue.conn.get(key)

    def set_cache_value(self, key, value):
        if value is None:
            value = ''
        return self.manager.queue.conn.set(key, value, ex=REDIS_LONG)
