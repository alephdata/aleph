from followthemoney import model
from followthemoney.link import Link

from aleph.core import kv


def store_links(key, links, expire=84600):
    # print("STORE", key)
    pipe = kv.pipeline()
    count = 0
    for link in links:
        # TODO: experiment with storage mechanisms here. @sunu did a
        # hash, which is memory-efficient but does not account for
        # multi-valued properties
        pipe.sadd(link.ref, link.pack())
        inverted = link.invert()
        pipe.sadd(inverted.ref, inverted.pack())
        count += 1
        yield link
    pipe.set(key, count, ex=expire)
    pipe.execute()


def load_links(ref):
    # print("LOAD", ref)
    for packed in kv.sscan_iter(ref):
        link = Link.unpack(model, ref, packed)
        if link is None:
            continue
        if link.inverted:
            link = link.invert()
        yield link


def has_links(key):
    return kv.get(key) is not None
