from flask import Blueprint, request

from aleph.views.cache import enable_cache
from aleph.search import CombinedQuery
from aleph.views.serializers import SearchResultSchema
from aleph.views.util import jsonify


blueprint = Blueprint('search_api', __name__)


@blueprint.route('/api/2/search')
def search():
    enable_cache()
    result = CombinedQuery.handle_request(request, schema=SearchResultSchema)
    # TODO do we want to include alerting info ("is the user subscribed to
    # the results of this query?")
    return jsonify(result)
