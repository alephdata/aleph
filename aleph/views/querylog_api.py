from flask import Blueprint, request

from aleph.core import db
from aleph.model import QueryLog
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import QueryLogSerializer
from aleph.views.util import require

blueprint = Blueprint('querylog_api', __name__)


@blueprint.route('/api/2/querylog', methods=['GET'])
def index():
    """Get query logs for the user.
    ---
    get:
      summary: Get query logs
      description: Get query logs for the user
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                allOf:
                - $ref: '#/components/schemas/QueryResponse'
                properties:
                  results:
                    type: array
                    items:
                      $ref: '#/components/schemas/QueryLog'
      tags:
      - Query Log
    """
    require(request.authz.logged_in)
    parser = QueryParser(request.args, request.authz)
    q = QueryLog.query_log(role_id=request.authz.id)
    result = DatabaseQueryResult(request, q, parser=parser)
    return QueryLogSerializer.jsonify_result(result)


@blueprint.route('/api/2/querylog', methods=['DELETE'])
def delete():
    """Delete the query logs for a particular search term.
    ---
    delete:
      summary: Clear query log
      description: Delete the query logs for a particular search term
      parameters:
      - in: query
        name: query
        schema:
          type: string
      responses:
        '204':
          description: No Content
      tags:
      - Query Log
    """
    require(request.authz.logged_in)
    query = request.args.get('query')
    if not query:
        return ('', 404)
    QueryLog.delete_query(request.authz.id, query)
    db.session.commit()
    return ('', 204)
