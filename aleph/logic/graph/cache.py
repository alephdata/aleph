import logging
from followthemoney import model
from followthemoney.link import Link

from aleph.core import kv
from aleph.util import make_key

log = logging.getLogger(__name__)


class CacheMiss(Exception):
    pass


def typed_key(type_, value, *extra):
    return make_key('graph-r6', type_.name, value, *extra)


def store_links(type_, value, links, expire=84600):
    pipe = kv.pipeline()
    key = typed_key(type_, value)
    ref = type_.ref(value)
    # log.debug("STORE: %s", key)
    count = 0
    for link in links:
        # TODO: experiment with storage mechanisms here. @sunu did a
        # hash, which is memory-efficient but does not account for
        # multi-valued properties
        if link.ref != ref:
            link = link.invert()
        _, packed = link.pack()
        pipe.sadd(key, packed)
        count += 1
    degree_key = typed_key(type_, value, 'deg')
    pipe.set(degree_key, count, ex=expire)
    pipe.execute()


def load_links(type_, value):
    # raise CacheMiss()
    degree_key = typed_key(type_, value, 'deg')
    if kv.get(degree_key) is None:
        raise CacheMiss()
    key = typed_key(type_, value)
    # log.debug("LOAD: %s", key)
    ref = type_.ref(value)
    for packed in kv.sscan_iter(key):
        # print("LOADED", key, packed)
        link = Link.unpack(model, ref, packed)
        if link is None:
            continue
        if link.inverted:
            link = link.invert()
        yield link
