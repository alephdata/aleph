import logging

from flask import Blueprint, request, abort

from aleph.model import Export
from aleph.search import DatabaseQueryResult
from aleph.views.serializers import ExportSerializer

log = logging.getLogger(__name__)
blueprint = Blueprint("exports_api", __name__)


@blueprint.route("/api/2/exports", methods=["GET"])
def index():
    """Returns a list of exports for the user.
    ---
    get:
      summary: List exports
      responses:
        '200':
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
                      $ref: '#/components/schemas/Export'
          description: OK
      tags:
        - Export
    """
    if not request.authz.logged_in:
        abort(401)
    query = Export.by_role_id(request.authz.id)
    result = DatabaseQueryResult(request, query)
    return ExportSerializer.jsonify_result(result)
