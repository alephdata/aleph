import logging
from flask import Blueprint, request, abort

from aleph.model import Role
from aleph.views.serializers import RoleSerializer

blueprint = Blueprint("groups_api", __name__)
log = logging.getLogger(__name__)


@blueprint.route("/api/2/groups", methods=["GET"])
def index():
    """
    ---
    get:
      summary: List groups
      description: >-
        Get the list of groups the user belongs to. Groups are used for
        authorization.
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
                      $ref: '#/components/schemas/Role'
      tags:
      - Role
    """
    if not request.authz.logged_in:
        abort(401)
    q = Role.all_groups(request.authz)
    return {"total": q.count(), "results": RoleSerializer().serialize_many(q.all())}
