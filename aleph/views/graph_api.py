from flask import Blueprint, request
from werkzeug.exceptions import NotImplemented
from apikit import jsonify, request_data

from aleph.core import get_graph as _get_graph
from aleph.events import log_event
from aleph.graph.queries import NodeQuery, EdgeQuery

blueprint = Blueprint('graph_api', __name__)


def get_graph():
    """Try and get a connection to Neo4J, ow raise HTTP exception."""
    graph = _get_graph()
    if graph is None:
        raise NotImplemented('Graph API is disabled.')
    return graph


@blueprint.route('/api/1/graph/nodes', methods=['GET'])
def get_nodes():
    log_event(request)
    return jsonify(NodeQuery(get_graph(), request.args.items()))


@blueprint.route('/api/1/graph/nodes', methods=['POST', 'PUT'])
def post_nodes():
    log_event(request)
    return jsonify(NodeQuery(get_graph(), request_data()))


@blueprint.route('/api/1/graph/edges', methods=['GET'])
def get_edges():
    log_event(request)
    return jsonify(EdgeQuery(get_graph(), request.args.items()))


@blueprint.route('/api/1/graph/edges', methods=['POST', 'PUT'])
def post_edges():
    log_event(request)
    return jsonify(EdgeQuery(get_graph(), request_data()))
