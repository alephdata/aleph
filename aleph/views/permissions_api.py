from banal import ensure_dict
from datetime import datetime
from flask import Blueprint, request

from aleph.core import db
from aleph.model import Role, Permission
from aleph.logic.roles import check_visible
from aleph.logic.permissions import update_permission
from aleph.logic.collections import update_collection
from aleph.views.serializers import PermissionSerializer
from aleph.views.util import get_db_collection, parse_request

blueprint = Blueprint("permissions_api", __name__)


@blueprint.route("/<int:collection_id>/permissions")
def index(collection_id):
    """
    ---
    get:
      summary: Get permissions for a collection
      description: >-
        Get the list of all permissions for the collection with id
        `collection_id`
      parameters:
      - in: path
        name: collection_id
        required: true
        schema:
          type: integer
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
                      $ref: '#/components/schemas/Permission'
      tags:
      - Permission
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    roles = Role.all_groups(request.authz).all()
    if request.authz.is_admin:
        roles.extend(Role.all_system())
    q = Permission.all()
    q = q.filter(Permission.collection_id == collection.id)
    permissions = []
    for permission in q.all():
        if not check_visible(permission.role, request.authz):
            continue
        permissions.append(permission)
        if permission.role in roles:
            roles.remove(permission.role)

    # this workaround ensures that all groups are visible for the user to
    # select in the UI even if they are not currently associated with the
    # collection.
    for role in roles:
        if collection.casefile and role.is_public:
            continue
        permissions.append(
            {
                "collection_id": collection.id,
                "write": False,
                "read": False,
                "role_id": str(role.id),
            }
        )

    permissions = PermissionSerializer().serialize_many(permissions)
    return {"total": len(permissions), "results": permissions}


@blueprint.route("/<int:collection_id>/permissions", methods=["POST", "PUT"])
def update(collection_id):
    """
    ---
    post:
      summary: Update permissions for a collection
      description: >
        Update permissions for the collection with id `collection_id`
      parameters:
      - in: path
        name: collection_id
        required: true
        schema:
          type: integer
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PermissionUpdateList'
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
                      $ref: '#/components/schemas/Permission'
      tags:
      - Permission
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    for permission in parse_request("PermissionUpdateList"):
        role_obj = ensure_dict(permission.get("role"))
        role_id = permission.get("role_id", role_obj.get("id"))
        role = Role.by_id(role_id)
        if not check_visible(role, request.authz):
            continue
        if role.is_public:
            permission["write"] = False
        if collection.casefile and role.is_public:
            permission["read"] = False

        update_permission(
            role,
            collection,
            permission["read"],
            permission["write"],
            editor_id=request.authz.id,
        )
    collection.updated_at = datetime.utcnow()
    update_collection(collection)
    db.session.commit()
    return index(collection_id)
