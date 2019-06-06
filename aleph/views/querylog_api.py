from flask import Blueprint, request

from aleph.core import db
from aleph.model import QueryLog
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import QueryLogSerializer
from aleph.views.util import require

blueprint = Blueprint('querylog_api', __name__)


@blueprint.route('/api/2/querylog', methods=['GET'])
def index():
    require(request.authz.logged_in)
    parser = QueryParser(request.args, request.authz)
    q = QueryLog.query_log(role_id=request.authz.id)
    result = DatabaseQueryResult(request, q, parser=parser)
    return QueryLogSerializer.jsonify_result(result)


@blueprint.route('/api/2/querylog', methods=['DELETE'])
def delete():
    """Delete the query logs for a particular search term"""
    require(request.authz.logged_in)
    query = request.args.get('query')
    if not query:
        return ('', 404)
    QueryLog.delete_query(request.authz.id, query)
    db.session.commit()
    return ('', 204)
