import logging
from hashlib import sha1
from py2neo import Relationship

from aleph.graph.util import GraphType

log = logging.getLogger(__name__)


class EdgeType(GraphType):
    _instances = {}

    def __init__(self, name, key=None, hidden=False):
        self.name = name
        self.key = key
        self.hidden = hidden
        self._instances[name] = self

    def merge(self, tx, source, target, **props):
        if source is None or target is None:
            return
        props['id'] = self.gen_id(source, target, props)
        rel = Relationship(source, self.name, target, **props)
        if self.key is None:
            tx.merge(rel, self.name)
        else:
            tx.merge(rel, self.name, self.key)
        return rel

    def gen_id(self, source, target, data):
        idkey = sha1(self.name)
        idkey.update(source['id'])
        idkey.update(target['id'])
        if self.key is not None and data.get(self.key):
            key = unicode(data[self.key]).encode('utf-8')
            idkey.update(key)
        return idkey.hexdigest()

    def to_dict(self):
        return {'name': self.name}

    @classmethod
    def dict(cls, rel):
        data = dict(rel)
        data['$type'] = rel.type()
        return data
