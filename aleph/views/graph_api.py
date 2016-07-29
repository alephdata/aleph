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


@blueprint.route('/api/1/graph/suggest')
def suggest_nodes():
    prefix = request.args.get('prefix', '').strip()
    collection_id = [int(c) for c in request.args.getlist('collection_id')]
    if len(prefix) < 3 and not len(collection_id):
        return jsonify({'status': 'ok', 'nodes': []})
    resp = queries.suggest_nodes(get_graph(), collection_id, prefix,
                                 get_limit(default=20), get_offset())
    return jsonify(resp)


@blueprint.route('/api/1/graph/nodes')
def load_nodes():
    node_ids = request.args.getlist('id')
    resp = queries.load_nodes(get_graph(), node_ids,
                              get_limit(default=20), get_offset())
    return jsonify(resp)
