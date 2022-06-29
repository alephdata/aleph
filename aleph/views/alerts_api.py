# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

from flask import Blueprint, request

from aleph.core import db
from aleph.model import Alert
from aleph.search import DatabaseQueryResult
from aleph.views.serializers import AlertSerializer
from aleph.views.util import require, obj_or_404
from aleph.views.util import parse_request
from aleph.views.context import tag_request

blueprint = Blueprint("alerts_api", __name__)


@blueprint.route("/api/2/alerts", methods=["GET"])
def index():
    """Returns a list of alerts for the user.
    ---
    get:
      summary: List alerts
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
                      $ref: '#/components/schemas/Alert'
          description: OK
      tags:
        - Alert
    """
    require(request.authz.logged_in)
    query = Alert.by_role_id(request.authz.id)
    result = DatabaseQueryResult(request, query)
    return AlertSerializer.jsonify_result(result)


@blueprint.route("/api/2/alerts", methods=["POST", "PUT"])
def create():
    """Creates an alert for a given query string.
    ---
    post:
      summary: Create an alert
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/AlertCreate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Alert'
          description: OK
      tags:
        - Alert
    """
    require(request.authz.session_write)
    data = parse_request("AlertCreate")
    alert = Alert.create(data, request.authz.id)
    db.session.commit()
    tag_request(alert_id=alert.id)
    return AlertSerializer.jsonify(alert)


@blueprint.route("/api/2/alerts/<int:alert_id>", methods=["GET"])
def view(alert_id):
    """Return the alert with id `alert_id`.
    ---
    get:
      summary: Fetch an alert
      parameters:
      - description: The alert ID.
        in: path
        name: alert_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Alert'
          description: OK
      tags:
      - Alert
    """
    require(request.authz.logged_in)
    alert = obj_or_404(Alert.by_id(alert_id, role_id=request.authz.id))
    return AlertSerializer.jsonify(alert)


@blueprint.route("/api/2/alerts/<int:alert_id>", methods=["DELETE"])
def delete(alert_id):
    """Delete the alert with id `alert_id`.
    ---
    delete:
      summary: Delete an alert
      parameters:
      - description: The alert ID.
        in: path
        name: alert_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      responses:
        '204':
          description: No Content
      tags:
      - Alert
    """
    require(request.authz.session_write)
    alert = obj_or_404(Alert.by_id(alert_id, role_id=request.authz.id))
    alert.delete()
    db.session.commit()
    return ("", 204)
