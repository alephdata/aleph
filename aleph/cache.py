import json
import logging

from aleph.util import make_key

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
        value = json.dumps(value)
        return self.set(key, value, expire=expire)

    def get(self, key):
        return self.kv.get(key)

    def get_complex(self, key):
        value = self.get(key)
        if value is not None:
            return json.loads(value)
