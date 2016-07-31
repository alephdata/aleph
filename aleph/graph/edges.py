from hashlib import sha1
from py2neo import Relationship

from aleph.graph.util import GraphType, ItemMapping


class EdgeType(GraphType):

    def __init__(self, name, key=None, hidden=False):
        self.name = name
        self.key = key
        self.hidden = hidden
        self._instances[name] = self

    def merge(self, tx, source, target, **props):
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
        if self.key is not None and self.key in data:
            key = unicode(data[self.key]).encode('utf-8')
            idkey.update(key)
        return idkey.hexdigest()

    def to_dict(self):
        return {'name': self.name}

    @classmethod
    def dict(cls, rel):
        data = dict(rel)
        # for type in node.labels():
        #     data['$label'] = label
        return data


class EdgeMapping(ItemMapping):
    """Map columns from the source data to a graph edge."""

    meta_type = EdgeType

    def __init__(self, mapping, config):
        super(EdgeMapping, self).__init__(mapping, config)
        self.source = config.get('source')
        self.target = config.get('target')

    def update(self, tx, row, nodes):
        """Prepare and load a graph edge."""
        props = self.bind_properties(row)
        source = nodes.get(self.source)
        target = nodes.get(self.target)
        if source is None or target is None:
            return
        return self.type.merge(tx, source, target, **props)
