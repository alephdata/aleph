from flask import Blueprint, request
from apikit import jsonify
from apikit import get_limit, get_offset

from aleph.model.metadata import CORE_FACETS
from aleph.views.cache import etag_cache_keygen
from aleph.search import construct_query, execute_query

blueprint = Blueprint('search', __name__)


@blueprint.route('/api/1/query')
def query():
    etag_cache_keygen()
    query = construct_query(request.args)
    query['size'] = get_limit(default=100)
    query['from'] = get_offset()
    return jsonify(execute_query(request.args, query))


@blueprint.route('/api/1/fields')
def attributes():
    etag_cache_keygen()
    return jsonify(CORE_FACETS)
