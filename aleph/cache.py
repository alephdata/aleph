import json
import logging

from aleph.util import make_key, JSONEncoder

log = logging.getLogger(__name__)


class Cache(object):

    def __init__(self, kv, expire=None, prefix=None):
        self.kv = kv
        self.expire = expire
        self.prefix = prefix

    def key(self, *parts):
        return make_key(self.prefix, *parts)

    def set(self, key, value, expire=None):
        expire = expire or self.expire
        self.kv.set(key, value, ex=expire)

    def set_complex(self, key, value, expire=None):
        value = json.dumps(value, cls=JSONEncoder)
        return self.set(key, value, expire=expire)

    def set_list(self, key, values, expire=None):
        self.kv.delete(key)
        if len(values):
            self.kv.rpush(key, *values)

    def get(self, key):
        return self.kv.get(key)

    def get_complex(self, key):
        value = self.get(key)
        if value is not None:
            return json.loads(value)

    def get_list(self, key):
        return self.kv.lrange(key, 0, -1)

    def lock(self, key, timeout=120):
        return self.kv.lock(key, timeout=timeout)

    def flush(self, prefix=None):
        prefix = prefix or self.prefix
        keys = []
        for key in self.kv.scan_iter(match='%s*' % prefix):
            log.info("Flush: %s", key.decode('utf-8'))
            keys.append(key)
            if len(keys) > 0 and len(keys) % 1000 == 0:
                self.kv.delete(*keys)
                keys = []
        if len(keys) > 0:
            self.kv.delete(*keys)
