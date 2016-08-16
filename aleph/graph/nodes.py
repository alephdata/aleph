import logging
from hashlib import sha1
from pylru import lrucache
from py2neo import Node

from aleph.graph.util import GraphType

log = logging.getLogger(__name__)


class NodeType(GraphType):
    _instances = {}

    def __init__(self, name, fingerprint='fingerprint', key=None,
                 hidden=False):
        self.name = name
        self.fingerprint = fingerprint
        self.key = key
        self.hidden = hidden
        self._instances[name] = self

    def ensure_indices(self, graph):
        indices = graph.schema.get_indexes(self.name)
        log.info("Creating indexes on: %s", self.name)
        if self.fingerprint not in indices:
            graph.schema.create_index(self.name, self.fingerprint)
        if self.key is not None and self.key not in indices:
            graph.schema.create_index(self.name, self.key)
        if 'id' not in indices:
            graph.schema.create_index(self.name, 'id')

    def _get_tx_cache(self, tx):
        if not hasattr(tx, '_node_lru_cache'):
            tx._node_lru_cache = lrucache(5000)
        return tx._node_lru_cache

    def get_cache(self, tx, fingerprint):
        cache = self._get_tx_cache(tx)
        if (self.name, fingerprint) in cache:
            return cache[(self.name, fingerprint)]

    def set_cache(self, tx, fingerprint, node):
        cache = self._get_tx_cache(tx)
        cache[(self.name, fingerprint)] = node

    def merge(self, tx, **props):
        fp = props.get(self.fingerprint)
        if fp is None:
            return
        props['id'] = self.gen_id(fp)
        node = Node(self.name, **props)
        tx.merge(node, self.name, self.fingerprint)
        self.set_cache(tx, fp, node)
        return node

    def to_dict(self):
        return {'name': self.name}

    def gen_id(self, fp):
        idkey = sha1(self.name)
        idkey.update(unicode(fp).encode('utf-8'))
        return idkey.hexdigest()

    @classmethod
    def dict(cls, node):
        data = dict(node)
        for label in node.labels():
            data['$label'] = label
        return data
