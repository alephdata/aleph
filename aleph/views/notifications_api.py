# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

from flask import Blueprint, request

from aleph.search import NotificationsQuery
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
    result = NotificationsQuery.handle(request)
    return NotificationSerializer.jsonify_result(result)
