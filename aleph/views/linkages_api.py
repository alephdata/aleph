import logging
from flask import Blueprint, request

from aleph.model import Linkage
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import LinkageSerializer
from aleph.views.util import require

blueprint = Blueprint("linkages_api", __name__)
log = logging.getLogger(__name__)


@blueprint.route("/api/2/linkages", methods=["GET"])
def index():
    """Returns a list of linkages for god entities
    ---
    get:
      summary: List linkages
      parameters:
      - description: >-
          Choose to filter for a specific role context.
        in: query
        name: "filter:context_id"
        schema:
          type: string
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
                      $ref: '#/components/schemas/Linkage'
      tags:
        - Linkage
    """
    require(request.authz.logged_in)
    parser = QueryParser(request.args, request.authz)
    context_ids = parser.getintlist("filter:context_id")
    q = Linkage.by_authz(request.authz, context_ids=context_ids)
    result = DatabaseQueryResult(request, q, parser=parser)
    return LinkageSerializer.jsonify_result(result)
