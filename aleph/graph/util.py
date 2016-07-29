import logging
from hashlib import sha1
from pylru import lrucache
from py2neo import Relationship, Node

ID = 'id'
log = logging.getLogger(__name__)


class NodeType(object):

    def __init__(self, name, fingerprint='fingerprint', key=None,
                 hidden=False):
        self.name = name
        self.fingerprint = fingerprint
        self.key = key
        self.hidden = hidden

    def ensure_indices(self, graph):
        indices = graph.schema.get_indexes(self.name)
        log.info("Creating indexes on: %s", self.name)
        if self.fingerprint not in indices:
            graph.schema.create_index(self.name, self.fingerprint)
        if self.key is not None and self.key not in indices:
            graph.schema.create_index(self.name, self.key)
        if ID not in indices:
            graph.schema.create_index(self.name, ID)

    def _get_tx_cache(self, tx):
        if not hasattr(tx, '_node_lru_cache'):
            tx._node_lru_cache = lrucache(5000)
        return tx._node_lru_cache

    def get_cache(self, tx, fingerprint):
        cache = self._get_tx_cache(tx)
        if (self.name, fingerprint) in cache:
            # print "CACHE HIT", (self.name, fingerprint)
            return cache[(self.name, fingerprint)]

    def set_cache(self, tx, fingerprint, node):
        cache = self._get_tx_cache(tx)
        cache[(self.name, fingerprint)] = node

    def merge(self, tx, **kw):
        fp = kw[self.fingerprint]
        if ID not in kw:
            kw[ID] = self.gen_id(fp)
        # node = self.get_cache(tx, fp)
        # if node is not None:
        #     return node
        node = Node(self.name, **kw)
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


class EdgeType(object):

    def __init__(self, name, key=None, hidden=False):
        self.name = name
        self.key = key
        self.hidden = hidden

    def merge(self, tx, source, target, **kw):
        if ID not in kw:
            kw[ID] = self.gen_id(source, target, kw)
        rel = Relationship(source, self.name, target, **kw)
        if self.key is None:
            tx.merge(rel, self.name)
        else:
            tx.merge(rel, self.name, self.key)

    def gen_id(self, source, target, data):
        idkey = sha1(source['id'])
        idkey.update(target['id'])
        if self.key is not None and self.key in data:
            key = unicode(data[self.key]).encode('utf-8')
            idkey.update(key)
        return idkey.hexdigest()

    def to_dict(self):
        return {'name': self.name}

    @classmethod
    def dict(cls, rel):
        data = dict(rel)
        for type in node.labels():
            data['$label'] = label
        return data
