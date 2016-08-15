import os
import logging
from time import time
from sqlalchemy.sql import text as sql_text
from sqlalchemy import MetaData, create_engine
from sqlalchemy.schema import Table

from aleph.core import get_graph, db
from aleph.model import Collection
from aleph.model.validation import validate
from aleph.graph.nodes import NodeType
from aleph.graph.edges import EdgeType
from aleph.graph.converter import Property

log = logging.getLogger(__name__)


class Mapping(object):
    """Main mapping executor, config and data access."""

    def __init__(self, config):
        validate(config, 'mapping.json#')
        self.config = config
        uri = os.path.expandvars(self.config.get('database'))
        self.engine = create_engine(uri)
        self.meta = MetaData()
        self.meta.bind = self.engine
        self.nodes = [NodeMapping(self, n, c) for (n, c)
                      in config.get('nodes').items()]
        self.edges = [EdgeMapping(self, c) for c in config.get('edges', [])]

    @property
    def query(self):
        query = self.config.get('query')
        if not query:
            table_name = self.config.get('table')
            table = Table(table_name, self.meta, autoload=True)
            query = table.select()
        else:
            query = sql_text(query)
        log.info("Query: %s", query)
        return query

    def create_collection(self, graph):
        collection = Collection.create({
            'foreign_id': self.config.get('collection'),
            'label': self.config.get('collection'),
            'managed': True
        })
        db.session.commit()
        coll_type = NodeType.get('Collection')
        return coll_type.merge(graph, name=collection.label,
                               fingerprint=collection.foreign_id,
                               alephCollection=collection.id)

    def load(self):
        """Generate query rows and load them into the graph."""
        graph = get_graph()
        self.collection = self.create_collection(graph)
        begin_time = time()
        rp = self.engine.execute(self.query)

        log.info("Query time: %.5fms", (time() - begin_time) * 1000)
        row_count = 0
        while True:
            graphtx = graph.begin()
            rows = rp.fetchmany(10000)
            if not len(rows):
                break
            for row in rows:
                row_count += 1
                self.update(graphtx, dict(row.items()))

                if row_count % 1000 == 0:
                    per_sec = row_count / (time() - begin_time)
                    log.info("Loaded: %s, %.1frows/s", row_count, per_sec)
            graphtx.commit()
        log.info("Finished %s rows.", row_count)

    def update(self, graphtx, row):
        """Generate nodes and edges for a single row."""
        nodes = {}
        for node in self.nodes:
            nodes[node.name] = node.update(graphtx, row)
        for edge in self.edges:
            edge.update(graphtx, row, nodes)


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


class EdgeMapping(ItemMapping):
    """Map columns from the source data to a graph edge."""

    meta_type = EdgeType

    def update(self, tx, row, nodes):
        """Prepare and load a graph edge."""
        props = self.bind_properties(row)
        source = nodes.get(self.config.get('source'))
        target = nodes.get(self.config.get('target'))
        return self.type.merge(tx, source, target, **props)


class NodeMapping(ItemMapping):
    """Map columns from the source data to a graph node."""

    meta_type = NodeType

    def __init__(self, mapping, name, config):
        super(NodeMapping, self).__init__(mapping, config)
        self.name = name

    def update(self, tx, row):
        """Prepare and load a node."""
        props = self.bind_properties(row)
        fp = props.get(self.type.fingerprint)
        node = self.type.get_cache(tx, fp)
        if node is not None:
            return node
        node = self.type.merge(tx, **props)
        if node is not None:
            EdgeType.get('PART_OF').merge(tx, node, self.mapping.collection)
        return node
