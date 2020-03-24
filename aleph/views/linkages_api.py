import logging
from flask import Blueprint, request

from aleph.model import Linkage
from aleph.search import DatabaseQueryResult
from aleph.views.serializers import LinkageSerializer
from aleph.views.util import require

blueprint = Blueprint('linkages_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/linkages', methods=['GET'])
def index():
    """Returns a list of linkages for god entities
    ---
    get:
      summary: List linkages
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
    q = Linkage.by_authz(request.authz)
    result = DatabaseQueryResult(request, q)
    return LinkageSerializer.jsonify_result(result)
