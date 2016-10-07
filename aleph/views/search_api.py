from flask import Blueprint, request
from apikit import jsonify
from apikit import get_limit, get_offset
from werkzeug.datastructures import MultiDict

from aleph import authz
from aleph.core import url_for, get_config
from aleph.views.cache import enable_cache
from aleph.views.util import get_document
from aleph.events import log_event
# from aleph.model import Collection
from aleph.search import documents_query, execute_documents_query
from aleph.search import records_query, execute_records_query
from aleph.search.peek import peek_query
from aleph.search.util import next_params


blueprint = Blueprint('search_api', __name__)


@blueprint.route('/api/1/query')
def query():
    enable_cache(vary_user=True,
                 vary=authz.collections(authz.READ))
    query = documents_query(request.args)
    query['size'] = get_limit(default=100)
    query['from'] = get_offset()
    # import json
    # print json.dumps(query, indent=2)
    result = execute_documents_query(request.args, query)
    params = next_params(request.args, result)
    log_event(request)
    if params is not None:
        result['next'] = url_for('search_api.query', **params)
    return jsonify(result)


@blueprint.route('/api/1/statistics')
def statistics():
    collections = authz.collections(authz.READ)
    enable_cache(vary=collections)
    query = documents_query(MultiDict())
    query['size'] = 0
    result = execute_documents_query(MultiDict(), query)
    # collections = Collection.category_statistics(collections)
    return jsonify({
        'document_count': result['total'],
        'collection_count': len(collections)
    })


@blueprint.route('/api/1/peek')
def peek():
    if not get_config('ALLOW_PEEKING', True):
        return jsonify({'active': False})

    enable_cache(vary_user=True,
                 vary=authz.collections(authz.READ))
    response = peek_query(request.args)
    if not authz.logged_in():
        response.pop('roles', None)
    return jsonify(response)


@blueprint.route('/api/1/query/records/<int:document_id>')
def records(document_id):
    document = get_document(document_id)
    enable_cache(vary_user=True)
    query = records_query(document.id, request.args)
    if query is None:
        return jsonify({
            'status': 'ok',
            'message': 'no query'
        })
    query['size'] = get_limit(default=30)
    query['from'] = get_offset()
    result = execute_records_query(query)
    params = next_params(request.args, result)
    if params is not None:
        result['next'] = url_for('search_api.record', document_id=document_id,
                                 **params)
    return jsonify(result)
