import os
import logging
from time import time
# from py2neo.database.status import TransientError
from sqlalchemy.sql import text as sql_text
from sqlalchemy import MetaData, create_engine
from sqlalchemy.schema import Table

from aleph.core import get_graph, db
from aleph.model import Collection
from aleph.model.validation import validate
from aleph.graph.nodes import NodeMapping
from aleph.graph.edges import EdgeMapping

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
        self.collection = Collection.create({
            'foreign_id': config.get('collection'),
            'label': config.get('collection'),
            'managed': True
        })
        db.session.add(self.collection)
        db.session.commit()

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

    def load(self):
        """Generate query rows and load them into the graph."""
        graph = get_graph()
        begin_time = time()
        rp = self.engine.execute(self.query)
        log.debug("Query time: %.5fms", (time() - begin_time) * 1000)
        stats = {'rows': 0, 'nodes': 0, 'rels': 0}
        while True:
            graphtx = graph.begin()
            rows = rp.fetchmany(10000)
            if not len(rows):
                break
            for row in rows:
                stats['rows'] += 1
                self.update(graphtx, dict(row.items()), stats)

                if stats['rows'] % 1000 == 0:
                    elapsed = (time() - begin_time)
                    stats['per_node'] = max(stats['nodes'], 1) / elapsed
                    log.info("Loaded: %(rows)s [%(nodes)s nodes, "
                             "%(rels)s edges], %(per_node).5f n/s", stats)
            graphtx.commit()
        log.info("Done. Loaded %(rows)s rows, %(nodes)s nodes, "
                 "%(rels)s edges.", stats)

    def update(self, graphtx, row, stats):
        """Generate nodes and edges for a single row."""
        nodes = {}
        for node in self.nodes:
            nodes[node.name] = node.update(graphtx, row)
            if nodes[node.name] is not None:
                stats['nodes'] += 1
        for edge in self.edges:
            rel = edge.update(graphtx, row, nodes)
            if rel is not None:
                stats['rels'] += 1
