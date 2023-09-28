from flask import Blueprint, request, abort

from aleph.search import NotificationsQuery
from aleph.views.serializers import NotificationSerializer

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
    if not request.authz.logged_in:
        abort(401)
    result = NotificationsQuery.handle(request)
    return NotificationSerializer.jsonify_result(result)
