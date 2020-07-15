from flask import Blueprint, request

from aleph.model import Role
from aleph.search import SearchQueryResult, SearchQueryParser
from aleph.logic.notifications import get_notifications
from aleph.views.serializers import NotificationSerializer
from aleph.views.util import require


blueprint = Blueprint("notifications_api", __name__)


@blueprint.route("/api/2/notifications", methods=["GET"])
def index():
    """
    ---
    get:
      summary: Get notifications
      description: Get all the notifications for the user
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
                      $ref: '#/components/schemas/Notification'
          description: OK
      tags:
      - Notification
    """
    require(request.authz.logged_in)
    role = Role.by_id(request.authz.id)
    parser = SearchQueryParser(request.args, request.authz)
    result = get_notifications(role, parser=parser)
    result = SearchQueryResult(request, parser, result)
    return NotificationSerializer.jsonify_result(result)
