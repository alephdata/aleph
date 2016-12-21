from flask import Blueprint, request
from apikit import jsonify

from aleph.core import url_for, get_config
from aleph.views.cache import enable_cache
from aleph.views.util import get_document
from aleph.events import log_event
# from aleph.model import Collection
from aleph.search import QueryState
from aleph.search import documents_query
from aleph.search import records_query, execute_records_query
from aleph.search.peek import peek_query
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


@blueprint.route('/api/1/peek')
def peek():
    if not get_config('ALLOW_PEEKING', True):
        return jsonify({'active': False})
    enable_cache(vary_user=True)
    state = QueryState(request.args, request.authz)
    response = peek_query(state)
    if not request.authz.logged_in:
        response.pop('roles', None)
    return jsonify(response)


@blueprint.route('/api/1/query/records/<int:document_id>')
def records(document_id):
    document = get_document(document_id)
    enable_cache(vary_user=True)
    state = QueryState(request.args, request.authz)
    query = records_query(document.id, state)
    result = execute_records_query(query)
    params = next_params(request.args, result)
    if params is not None:
        result['next'] = url_for('search_api.record',
                                 document_id=document_id,
                                 **params)
    return jsonify(result)
