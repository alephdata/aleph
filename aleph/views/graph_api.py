from flask import Blueprint, request
from werkzeug.exceptions import NotImplemented
from apikit import jsonify, get_limit, get_offset, request_data

from aleph import authz
from aleph.core import get_graph as _get_graph
# from aleph.events import log_event
from aleph.graph import queries

blueprint = Blueprint('graph_api', __name__)


def get_graph():
    """Try and get a connection to Neo4J, ow raise HTTP exception."""
    graph = _get_graph()
    if graph is None:
        raise NotImplemented('Graph API is disabled.')
    return graph


def get_labels():
    return []


@blueprint.route('/api/1/graph/suggest')
def suggest_nodes():
    collections = authz.collections(authz.READ)
    prefix = request.args.get('prefix', '').strip()
    if len(prefix) < 3:
        return jsonify({'status': 'ok', 'nodes': []})
    resp = queries.suggest_nodes(get_graph(), collections,
                                 prefix, get_labels(),
                                 get_limit(default=20),
                                 get_offset())
    return jsonify(resp)


@blueprint.route('/api/1/graph/nodes')
def load_nodes():
    collections = authz.collections(authz.READ)
    node_ids = request.args.getlist('id')
    resp = queries.load_nodes(get_graph(), collections, node_ids,
                              get_labels(), get_limit(default=20),
                              get_offset())
    return jsonify(resp)
