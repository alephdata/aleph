import logging
from flask import Blueprint, request

from aleph.search import QueryParser, DatabaseQueryResult
from aleph.model import Audit
from aleph.views.util import jsonify
from aleph.serializers import QueryLogSchema

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
