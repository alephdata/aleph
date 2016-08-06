import logging

from aleph.graph.converter import Property

log = logging.getLogger(__name__)


class GraphType(object):
    @classmethod
    def get(cls, name, **kw):
        if name not in cls._instances:
            cls._instances[name] = cls(name, **kw)
        return cls._instances[name]

    @classmethod
    def all(cls):
        return cls._instances.values()


class ItemMapping(object):
    """Base class used by graph element mappers."""

    def __init__(self, mapping, config):
        self.mapping = mapping
        self.config = config
        self.label = config.get('label')
        self.type = self.meta_type.get(self.label)
        self.properties = []
        for name, config in config.get('properties', {}).items():
            self.properties.append(Property(self, name, config))

    def bind_properties(self, row):
        """Fill graph properties from source row."""
        props = {}
        for prop in self.properties:
            value = prop.bind(row)
            if value is not None:
                props[prop.name] = value
        return props


def delete_orphan_nodes(tx):
    pass
    # cur = tx.run("MATCH (n) WHERE NOT (n)--() DELETE n;")
    # log.debug("Deleted %(nodes_deleted)s orphan nodes.", cur.stats())
