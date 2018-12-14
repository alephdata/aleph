import msgpack
import logging
from followthemoney import model
from followthemoney.graph import Link

from aleph.core import cache

log = logging.getLogger(__name__)
DEGREE = '&deg'


class CacheMiss(Exception):
    pass


def typed_key(node, *extra):
    return cache.key('g3', node.type.name, node.value, *extra)


def store_links(node, links):
    key = typed_key(node)
    degree_key = typed_key(node, DEGREE)
    pipe = cache.kv.pipeline()
    pipe.set(degree_key, len(links), ex=cache.EXPIRE)
    pipe.delete(key)
    for link in links:
        values = list(link.to_tuple())[1:]
        value = msgpack.packb(values, use_bin_type=True)
        pipe.lpush(key, value)
    pipe.execute()


def load_links(node):
    degree_key = typed_key(node, DEGREE)
    if cache.kv.get(degree_key) is None:
        raise CacheMiss()
    key = typed_key(node)
    for packed in cache.kv.lrange(key, 0, -1):
        data = msgpack.unpackb(packed, raw=False)
        data = tuple((node, *data))
        link = Link.from_tuple(model, data)
        if link is not None:
            yield link
