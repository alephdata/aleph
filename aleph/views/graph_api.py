from flask import Blueprint, request
from werkzeug.exceptions import NotImplemented
from apikit import jsonify, get_limit, get_offset, request_data

from aleph import authz
from aleph.core import get_graph as _get_graph
# from aleph.events import log_event
from aleph.graph import queries

blueprint = Blueprint('graph_api', __name__)

# minimal graph API:
# /api/1/collections/<id>/graph
#   -> return a basic set of all the nodes in this
#      collection - e.g. documents, entities, phones
#      must be paginated.
# /api/1/graph/node/<id>
#   -> return all the nodes adjacent to <id>, sorted
#      by degree
# /api/1/graph/complete?id=&length=<max_pathlen>
#   -> given a list of node IDs (via GET or POST),
#      return all connections between them.
# /api/1/graph/suggest?prefix=&label=
#   -> return all completions of the given prefix
#      for a node title. Optional filter by label type.

# Response format:
#
# nodes:
#  - xxx
# edges:
#  - xxx


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
