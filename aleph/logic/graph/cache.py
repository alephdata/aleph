import msgpack
import logging
from followthemoney import model
from followthemoney.link import Link

from aleph.core import cache

log = logging.getLogger(__name__)
EXPIRATION = 84600 * 7
DEGREE = '&deg'


class CacheMiss(Exception):
    pass


def typed_key(type_, value, *extra):
    return cache.key('graph7', type_.name, value, *extra)


def store_links(type_, value, links, expire=EXPIRATION):
    key = typed_key(type_, value)
    degree_key = typed_key(type_, value, DEGREE)
    pipe = cache.kv.pipeline()
    pipe.set(degree_key, len(links), ex=expire)
    pipe.delete(key)
    for link in links:
        value = msgpack.packb(link.to_tuple(), use_bin_type=True)
        pipe.lpush(key, value)
    pipe.execute()


def load_links(type_, value):
    # raise CacheMiss()
    degree_key = typed_key(type_, value, DEGREE)
    if cache.get(degree_key) is None:
        raise CacheMiss()
    key = typed_key(type_, value)
    ref = type_.ref(value)
    for packed in cache.kv.lrange(key, 0, -1):
        data = msgpack.unpackb(packed, raw=False)
        link = Link.from_tuple(model, ref, data)
        if link is not None:
            yield link
