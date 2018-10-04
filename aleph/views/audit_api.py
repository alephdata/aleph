import logging
from flask import Blueprint, request
from flask.wrappers import Response

from aleph.search import QueryParser, DatabaseQueryResult
from aleph.model import Audit
from aleph.views.util import jsonify
from aleph.serializers import QueryLogSchema
from aleph.core import db
from aleph.views.util import require

blueprint = Blueprint('history_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/querylog', methods=['GET'])
def index():
    parser = QueryParser(request.args, request.authz)
    q = Audit.query_log(role_id=request.authz.id,
                        session_id=request.session_id)
    result = DatabaseQueryResult(request, q,
                                 parser=parser,
                                 schema=QueryLogSchema)
    return jsonify(result)


@blueprint.route('/api/2/querylog', methods=['DELETE'])
def delete():
    """Delete the query logs for a particular search term"""
    require(request.authz.logged_in)
    query = request.args.get('query')
    if query:
        audit_logs = Audit.by_query_text(query, role_id=request.authz.id)
        if audit_logs.count():
            for audit in audit_logs:
                audit.delete()
            db.session.commit()
            return ('', 204)
    return Response(status=404)
