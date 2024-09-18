import logging
from banal import ensure_list
from flask_babel import gettext
from flask import Blueprint, request
from itsdangerous import BadSignature
from werkzeug.exceptions import BadRequest
from sqlalchemy import func

from aleph.core import db
from aleph.authz import Authz
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.model import Role
from aleph.logic.roles import challenge_role, update_role, create_user, get_deep_role
from aleph.util import is_auto_admin
from aleph.views.serializers import RoleSerializer
from aleph.views.util import require, jsonify, parse_request, obj_or_404
from aleph.views.context import tag_request

blueprint = Blueprint("roles_api", __name__)
log = logging.getLogger(__name__)


@blueprint.route("/api/2/roles/_suggest", methods=["GET"])
def suggest():
    """
    ---
    get:
      summary: Suggest users matching a search prefix
      description: >-
        For a given `prefix`, suggest matching user accounts. For
        security reasons, the prefix must be more than three
        characters long.
      parameters:
      - in: query
        name: prefix
        required: true
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
                      $ref: '#/components/schemas/Role'
      tags:
      - Role
    """
    require(request.authz.logged_in)
    parser = QueryParser(request.args, request.authz, limit=10)
    if parser.prefix is None or len(parser.prefix) < 6:
        # Do not return 400 because it's a routine event.
        return jsonify(
            {
                "status": "error",
                "message": gettext("prefix filter is too short"),
                "results": [],
                "total": 0,
            }
        )
    # this only returns users, not groups
    exclude = ensure_list(parser.excludes.get("id"))
    query = (
        Role.all_users()
        .where(Role.id.not_in(exclude))
        .where(func.lower(Role.email) == parser.prefix.lower())
    )
    result = DatabaseQueryResult(request, query, parser=parser)
    return RoleSerializer.jsonify_result(result)


@blueprint.route("/api/2/roles/code", methods=["POST"])
def create_code():
    """Send a account creation token to an email address.
    ---
    post:
      summary: Begin account registration
      description: >
        Begin validating a user email by sending a token to the address
        which can then be used to create an account.
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RoleCodeCreate'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                  token:
                    type: string
      tags:
      - Role
    """
    require(request.authz.can_register())
    data = parse_request("RoleCodeCreate")
    challenge_role(data)
    return jsonify(
        {"status": "ok", "message": gettext("To proceed, please check your email.")}
    )


@blueprint.route("/api/2/roles", methods=["POST"])
def create():
    """Create a user role.
    ---
    post:
      summary: Create a user account
      description: >
        Create a user role by supplying the required account details.
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RoleCreate'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Role'
      tags:
      - Role
    """
    require(request.authz.can_register())
    data = parse_request("RoleCreate")
    try:
        email = Role.SIGNATURE.loads(data.get("code"), max_age=Role.SIGNATURE_MAX_AGE)
    except BadSignature:
        return jsonify(
            {"status": "error", "message": gettext("Invalid code")}, status=400
        )

    role = Role.by_email(email)
    if role is not None:
        return jsonify(
            {"status": "error", "message": gettext("Email is already registered")},
            status=409,
        )

    role = create_user(
        email, data.get("name"), data.get("password"), is_admin=is_auto_admin(email)
    )
    # Let the serializer return more info about this user
    request.authz = Authz.from_role(role)
    tag_request(role_id=role.id)
    return RoleSerializer.jsonify(role, status=201)


@blueprint.route("/api/2/roles/<int:id>", methods=["GET"])
def view(id):
    """Retrieve role details.
    ---
    post:
      summary: Retrieve role details
      description: >
        Fetch detailed information about a role that the user is
        entitled to access, e.g. their own role, or a group they
        are part of.
      parameters:
      - in: path
        name: id
        required: true
        description: role ID
        schema:
          type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Role'
      tags:
      - Role
    """
    role = obj_or_404(Role.by_id(id))
    require(request.authz.can_read_role(role.id))
    data = role.to_dict()
    if request.authz.can_write_role(role.id):
        data.update(get_deep_role(role))
    return RoleSerializer.jsonify(data)


@blueprint.route("/api/2/roles/<int:id>", methods=["POST", "PUT"])
def update(id):
    """Change user SETTINGS.
    ---
    post:
      summary: Change user settings
      description: >
        Update a role to change its display name, or to define a
        new login password. Users can only update roles they have
        write access to, i.e. their own.
      parameters:
      - in: path
        name: id
        required: true
        description: role ID
        schema:
          type: integer
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RoleUpdate'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Role'
      tags:
      - Role
    """
    role = obj_or_404(Role.by_id(id))
    require(request.authz.can_write_role(role.id))
    data = parse_request("RoleUpdate")

    # When changing passwords, check the old password first.
    # cf. https://github.com/alephdata/aleph/issues/718
    if data.get("password"):
        current_password = data.get("current_password")
        if not role.check_password(current_password):
            raise BadRequest(gettext("Incorrect password."))

    role.update(data)
    db.session.add(role)
    db.session.commit()
    update_role(role)
    return RoleSerializer.jsonify(role)
