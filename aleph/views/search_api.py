from flask import Blueprint, request

from aleph.views.cache import enable_cache
from aleph.search import CombinedQuery
from aleph.serializers.entities import CombinedSchema
from aleph.views.util import jsonify


blueprint = Blueprint('search_api', __name__)


@blueprint.route('/api/2/search')
def search():
    enable_cache()
    result = CombinedQuery.handle(request, schema=CombinedSchema)
    # TODO do we want to include alerting info ("is the user subscribed to
    # the results of this query?")
    return jsonify(result)
