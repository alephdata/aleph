import logging
from datetime import datetime, date

from aleph.graph.schema import NodeType, EdgeType
from aleph.graph.util import fingerprint, addressfp, lowercase
from aleph.graph.util import email, phone, trim
from aleph.exceptions import GraphException

log = logging.getLogger(__name__)


class Property(object):
    # Can apply either to a node or an edge.

    TRANSFORMS = {
        'fingerprint': fingerprint,
        'addressfp': addressfp,
        'lowercase': lowercase,
        'email': email,
        'phone': phone,
        'trim': trim
    }

    def __init__(self, item, name, config):
        self.item = item
        self.name = name
        self.config = config
        self.key = config.get('key', False)
        self.column = config.get('column')
        self.literal = config.get('literal')
        self.format = config.get('format')
        self.nulls = config.get('nulls', [])
        self.country = config.get('country')
        self.transforms = config.get('transforms', [])
        if config.get('transform'):
            self.transforms.append(config.get('transform'))

    def bind(self, row):
        value = row.get(self.column, self.literal)
        if self.format is not None:
            value = self.format % row
        if value in self.nulls:
            return None
        if value is None:
            return self.literal
        for transform in self.transforms:
            if transform not in self.TRANSFORMS:
                raise GraphException("No such transformer: %r" % transform)
            value = self.TRANSFORMS[transform](value, row=row, prop=self)
            if value is None:
                return
        if isinstance(value, datetime):
            value = value.date()
        if isinstance(value, date):
            value = value.isoformat()
        return value


class ItemMapping(object):

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


class NodeMapping(ItemMapping):
    """Map columns from the source data to a graph node."""

    meta_type = NodeType

    def __init__(self, mapping, name, config):
        super(NodeMapping, self).__init__(mapping, config)
        self.name = name

    def update(self, tx, row):
        """Prepare and load a node."""
        props = self.bind_properties(row)
        return self.type.merge(tx, **props)


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
