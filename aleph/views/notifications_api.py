from datetime import datetime
from flask import Blueprint, request

from aleph.core import db
from aleph.model import Notification, Role
from aleph.search import DatabaseQueryResult
from aleph.logic.notifications import get_role_channels
from aleph.views.serializers import NotificationSerializer
from aleph.views.util import jsonify, require


blueprint = Blueprint('notifications_api', __name__)


@blueprint.route('/api/2/notifications', methods=['GET'])
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
    query = Notification.by_channels(get_role_channels(role), role)
    result = DatabaseQueryResult(request, query)
    return NotificationSerializer.jsonify_result(result)


@blueprint.route('/api/2/notifications', methods=['DELETE'])
def mark_read():
    """
    ---
    delete:
      summary: Clear notifications
      description: Delete all notification for the user
      responses:
        '202':
          content:
            application/json:
              schema:
                properties:
                  status:
                    description: ok
                    type: string
                type: object
          description: Accepted
      tags:
      - Notification
    """
    require(request.authz.logged_in)
    role = Role.by_id(request.authz.id)
    role.notified_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'ok'}, status=202)
