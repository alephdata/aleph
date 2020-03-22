import logging
from collections import defaultdict

from followthemoney import model
from followthemoney.graph import Graph
from followthemoney.types import registry

# from aleph.index import entities as index
from aleph.logic.entities import entity_expand_nodes
from aleph.model import Entity
from aleph.logic import resolver


log = logging.getLogger(__name__)


class AlephGraph(Graph):
    def queue(self, id_, proxy=None):
        if id_ not in self.proxies:
            self.proxies[id_] = proxy
            resolver.queue(self, Entity, id_)

    def resolve(self):
        resolver.resolve(self)
        for id_, proxy in self.proxies.items():
            if proxy is None:
                entity = resolver.get(self, Entity, id_)
                proxy = model.get_proxy(entity)
            node_id = registry.entity.node_id_safe(id_)
            node = self.nodes.get(node_id)
            if node is not None:
                node.proxy = proxy
                if node.schema is None:
                    node.schema = proxy.schema

    def get_adjacent_entities(self, proxy):
        source_node_id = registry.entity.node_id_safe(proxy.id)
        adjacents = defaultdict(list)
        exapnded_prop_nodes = []
        for edge in self.edges.values():
            if edge.source_id == source_node_id:
                if edge.target.is_entity:
                    adjacents[edge.type_name].append(edge.target.proxy)
                else:
                    exapnded_prop_nodes.append(edge.target_id)
            if edge.target_id == source_node_id:
                if edge.source.is_entity:
                    adjacents[edge.type_name].append(edge.source.proxy)
        for edge in self.edges.values():
            if (edge.target_id in exapnded_prop_nodes
                    and edge.source_id != source_node_id):
                adjacents[edge.type_name].append(edge.source.proxy)
        return adjacents

    def to_dict(self):
        return {
            'nodes': self.nodes.values(),
            'edges': self.edges.values()
        }


def expand_entity_graph(entity, edge_types, properties=None, authz=None):
    graph = AlephGraph(edge_types=edge_types)
    source_proxy = model.get_proxy(entity)
    graph.add(source_proxy)
    for prop, total, entities in entity_expand_nodes(
        entity, edge_types, properties=properties,
        include_entities=True, authz=authz
    ):
        for ent in entities:
            proxy = model.get_proxy(ent)
            graph.add(proxy)
    graph.resolve()
    return graph.get_adjacent_entities(source_proxy)
