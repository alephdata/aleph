from flask import Blueprint, request
from apikit import jsonify

from aleph.views.cache import enable_cache
from aleph.events import log_event
from aleph.search import CombinedQuery


blueprint = Blueprint('search_api', __name__)


@blueprint.route('/api/2/search')
def search():
    enable_cache()
    log_event(request)
    result = CombinedQuery.handle_request(request)
    return jsonify(result)
