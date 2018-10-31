import io
import time
import logging
import networkx as nx
from pprint import pprint  # noqa
from followthemoney.graph import Node
from followthemoney.types import registry
from networkx.readwrite.gexf import write_gexf

# from aleph.index.entities import iter_entities
from aleph.logic.graph.traversal import Graph

log = logging.getLogger(__name__)


def export_graph(entity_id, steam=2):
    start = time.time()
    query = Graph()
    query.seed(Node(registry.entity, entity_id))
    query.build(steps=steam)
    end = time.time()
    duration = end - start
    log.info("Traversal time: %s" % duration)

    graph = nx.DiGraph()
    for link in query.links:
        link.to_digraph(graph)
    buffer = io.BytesIO()
    write_gexf(graph, buffer)
    text = buffer.getvalue()
    return str(text, 'utf-8')
