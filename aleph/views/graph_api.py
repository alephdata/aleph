from itertools import combinations

from flask import Blueprint, request
import networkx as nx
from networkx import degree_centrality
from networkx.readwrite import json_graph

from aleph import authz
from aleph.views.util import jsonify
from aleph.search import raw_iter
from aleph.search.queries import document_query

blueprint = Blueprint('graph', __name__)


def multigraph_to_weighted(multigraph):
    graph = nx.Graph()
    for id, data in multigraph.nodes_iter(data=True):
        graph.add_node(id, **data)
    for u, v, data in multigraph.edges_iter(data=True):
        w = data['weight']
        if graph.has_edge(u, v):
            graph[u][v]['weight'] += w
        else:
            graph.add_edge(u, v, weight=w)
    degree = degree_centrality(graph)
    for id in multigraph.nodes_iter():
        graph.node[id]['degree'] = degree.get(id)
    return graph


def generate_graph(args):
    fields = ['id', 'collection', 'entities.id', 'entities.label',
              'entities.category']
    query = document_query(args, fields=fields,
                           collections=authz.authz_collections('read'),
                           lists=authz.authz_lists('read'),
                           facets=False)
    graph = nx.MultiGraph()
    for doc in raw_iter(query):
        entities = set()
        for entity in doc.get('_source').get('entities', []):
            if not graph.has_node(entity.get('id')):
                graph.add_node(entity.get('id'),
                               label=entity.get('label'),
                               category=entity.get('category'))
            entities.add(entity.get('id'))
        for (src, dst) in combinations(entities, 2):
            graph.add_edge(src, dst, weight=1)
    return multigraph_to_weighted(graph)


@blueprint.route('/api/1/graph')
def query():
    graph = generate_graph(request.args)
    return jsonify(json_graph.node_link_data(graph))
