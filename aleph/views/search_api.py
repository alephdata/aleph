from flask import Blueprint, request
from apikit import jsonify

from aleph.views.cache import enable_cache
from aleph.events import log_event
from aleph.search import DocumentsQuery


blueprint = Blueprint('search_api', __name__)


@blueprint.route('/api/2/query')
def query():
    enable_cache(vary_user=True)
    log_event(request)
    result = DocumentsQuery.handle_request(request)
    return jsonify(result)
