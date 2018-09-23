import io
import logging
import networkx as nx
from pprint import pprint  # noqa
from followthemoney import model
from networkx.readwrite.gexf import write_gexf

# from aleph.index.entities import iter_entities
from aleph.logic.graph.traversal import traverse_entity

log = logging.getLogger(__name__)


def links_to_graph(links):
    graph = nx.DiGraph()
    for link in links:
        if link.value is None:
            continue
        graph.add_node(link.ref, label=link.subject)
        if link.prop == model.get('Thing').get('name'):
            graph.nodes[link.ref]['label'] = link.value
        graph.add_node(link.value_ref)
        edge = {
            'weight': link.weight,
            'label': link.prop.label,
            'prop': link.prop.qname
        }
        graph.add_edge(link.ref, link.value_ref, **edge)
    return graph


def export_node(entity_id, steam=2):
    links = traverse_entity(entity_id, steam=steam)
    graph = links_to_graph((l for (s, l) in links))
    buffer = io.BytesIO()
    write_gexf(graph, buffer)
    text = buffer.getvalue()
    return str(text, 'utf-8')
