import json
import logging
from servicelayer import settings
from servicelayer.cache import make_key

from aleph.util import JSONEncoder

log = logging.getLogger(__name__)


class Cache(object):
    EXPIRE = settings.REDIS_EXPIRE

    def __init__(self, kv, expires=None, prefix=None):
        self.kv = kv
        self.expires = expires
        self.prefix = prefix

    def key(self, *parts):
        return make_key(self.prefix, *parts)

    def object_key(self, clazz, key, *parts):
        return self.key(clazz.__name__, key, *parts)

    def set(self, key, value, expires=None):
        expires = expires or self.expires
        self.kv.set(key, value, ex=expires)

    def set_complex(self, key, value, expires=None):
        value = json.dumps(value, cls=JSONEncoder)
        return self.set(key, value, expires=expires)

    def set_list(self, key, values, expires=None):
        self.kv.delete(key)
        if len(values):
            self.kv.rpush(key, *values)
            if expires is not None:
                self.kv.expire(key, expires)

    def get(self, key):
        return self.kv.get(key)

    def get_complex(self, key):
        value = self.get(key)
        if value is not None:
            return json.loads(value)

    def get_many_complex(self, keys):
        if not len(keys):
            return
        values = self.kv.mget(keys)
        for key, value in zip(keys, values):
            if value is not None:
                value = json.loads(value)
            yield key, value

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
