from flask import Blueprint, request
from apikit import jsonify

from aleph.core import url_for
from aleph.views.cache import enable_cache
from aleph.events import log_event
from aleph.search import QueryState
from aleph.search import documents_query
from aleph.search.util import next_params


blueprint = Blueprint('search_api', __name__)


@blueprint.route('/api/1/query')
def query():
    enable_cache(vary_user=True)
    state = QueryState(request.args, request.authz)
    result = documents_query(state)
    params = next_params(request.args, result)
    log_event(request)
    if params is not None:
        result['next'] = url_for('search_api.query', **params)
    return jsonify(result)
