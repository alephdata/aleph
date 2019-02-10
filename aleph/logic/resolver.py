import logging
from normality import stringify
from collections import defaultdict

from aleph.model import Role, Collection, Alert, Entity
from aleph.logic.roles import get_role
from aleph.logic.alerts import get_alert
from aleph.logic.collections import get_collection
from aleph.index.entities import entities_by_ids

log = logging.getLogger(__name__)

LOADERS = {
    Role: get_role,
    Collection: get_collection,
    Alert: get_alert
}


def _instrument_stub(stub):
    if not hasattr(stub, '_rx_queue'):
        stub._rx_queue = defaultdict(set)
    if not hasattr(stub, '_rx_cache'):
        stub._rx_cache = {}


def queue(stub, clazz, key):
    _instrument_stub(stub)
    key = stringify(key)
    if key is None:
        return
    stub._rx_queue[clazz].add(key)


def resolve(stub):
    _instrument_stub(stub)
    for clazz, keys in stub._rx_queue.items():
        keys = [k for k in keys if (clazz, k) not in stub._rx_cache]
        if not len(keys):
            continue

        log.debug("Resolve %s: %r", clazz.__name__, keys)
        if clazz == Entity:
            for entity in entities_by_ids(keys):
                key = entity.get('id')
                stub._rx_cache[(Entity, key)] = entity

        loader = LOADERS.get(clazz)
        if loader is not None:
            for key in keys:
                stub._rx_cache[(clazz, key)] = loader(key)


def get(stub, clazz, key):
    _instrument_stub(stub)
    key = stringify(key)
    if key is None:
        return
    return stub._rx_cache.get((clazz, key))
