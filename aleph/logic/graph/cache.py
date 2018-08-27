from aleph.core import kv
from aleph.logic.graph.link import Link


def store_links(key, links, expire=None):
    pipe = kv.pipeline()
    count = 0
    for link in links:
        # TODO: experiment with storage mechanisms here. @sunu did a
        # hash, which is memory-efficient but does not account for
        # multi-valued properties
        pipe.sadd(link.ref, link.pack())
        count += 1
        yield link
    pipe.set(key, count, ex=expire)
    pipe.execute()


def load_links(ref):
    for packed in kv.get(ref):
        link = Link.unpack(ref, packed)
        if link.inverted:
            link = link.invert()
        yield link


def has_links(key):
    return False
    return kv.get(kv) is not None
