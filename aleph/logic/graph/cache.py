import logging
from followthemoney import model
from followthemoney.link import Link

from aleph.core import kv
from aleph.util import make_key

log = logging.getLogger(__name__)


class CacheMiss(Exception):
    pass


def typed_key(type_, value, *extra):
    return make_key('r7', type_.name, value, *extra)


def store_links(type_, value, links, expire=84600):
    key = typed_key(type_, value)
    # log.debug("STORE: %s", key)
    values = []
    for link in links:
        # TODO: experiment with storage mechanisms here. @sunu did a
        # hash, which is memory-efficient but does not account for
        # multi-valued properties
        _, packed = link.pack()
        values.append(packed)
    degree_key = typed_key(type_, value, 'deg')
    kv.set(degree_key, len(values), ex=expire)
    if len(values):
        kv.rpush(key, *values)


def load_links(type_, value):
    # raise CacheMiss()
    degree_key = typed_key(type_, value, 'deg')
    if kv.get(degree_key) is None:
        raise CacheMiss()
    key = typed_key(type_, value)
    # log.debug("LOAD: %s", key)
    ref = type_.ref(value)
    for packed in kv.lrange(key, 0, -1):
        # print("LOADED", key, packed)
        link = Link.unpack(model, ref, packed)
        if link is None:
            continue
        yield link
