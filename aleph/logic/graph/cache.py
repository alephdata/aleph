import msgpack
import logging
from followthemoney import model
from followthemoney.link import Link

from aleph.core import kv
from aleph.util import make_key

log = logging.getLogger(__name__)
EXPIRATION = 84600 * 7
DEGREE = 'degree'


class CacheMiss(Exception):
    pass


def typed_key(type_, value, *extra):
    return make_key('graph', type_.name, value, *extra)


def store_links(type_, value, links, expire=EXPIRATION):
    pipe = kv.pipeline()
    degree_key = typed_key(type_, value, DEGREE)
    values = []
    for link in links:
        value = msgpack.packb(link.to_tuple(), use_bin_type=True)
        values.append(value)
    key = typed_key(type_, value)
    pipe.delete(key)    
    if len(values):
        pipe.rpush(key, *values)
    pipe.set(degree_key, len(values), ex=expire)
    pipe.execute()


def load_links(type_, value):
    # raise CacheMiss()
    degree_key = typed_key(type_, value, DEGREE)
    if kv.get(degree_key) is None:
        raise CacheMiss()
    key = typed_key(type_, value)
    ref = type_.ref(value)
    for packed in kv.lrange(key, 0, -1):
        data = msgpack.unpackb(packed, raw=False)
        link = Link.from_tuple(model, ref, data)
        if link is not None:
            yield link
