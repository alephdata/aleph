from flask import Blueprint, request
from apikit import obj_or_404, jsonify, request_data

from aleph.model import Collection
from aleph.search import QueryState
from aleph.search.leads import leads_query
from aleph.events import log_event

blueprint = Blueprint('leads_api', __name__)


@blueprint.route('/api/1/collections/<int:collection_id>/leads',
                 methods=['GET'])
def index(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    request.authz.require(request.authz.collection_read(collection))
    state = QueryState(request.args, request.authz)
    results = leads_query(collection_id, state)
    return jsonify(results)


# @blueprint.route('/api/1/collections/<int:collection_id>/leads/<id>',
#                  methods=['POST', 'PUT'])
# def update(collection_id, lead):
#     collection = obj_or_404(Collection.by_id(collection_id))
#     request.authz.require(request.authz.collection_write(collection))
#     data = request_data()
#
#     log_event(request)
#     return jsonify({'status': 'ok', 'data': data})
