import logging
from flask import Blueprint, request

from aleph.model import Role, Permission, Audit
from aleph.logic.roles import check_visible
from aleph.logic.permissions import update_permission
from aleph.logic.collections import update_collection
from aleph.logic.audit import record_audit
from aleph.serializers.roles import PermissionSchema
from aleph.views.util import get_db_collection, jsonify, parse_request

blueprint = Blueprint('permissions_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/collections/<int:id>/permissions')
def index(id):
    collection = get_db_collection(id, request.authz.WRITE)
    record_audit(Audit.ACT_COLLECTION, id=id)
    roles = [r for r in Role.all_groups() if check_visible(r, request.authz)]
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
        permissions.append({
            'collection_id': collection.id,
            'write': False,
            'read': False,
            'role': role
        })

    permissions, errors = PermissionSchema().dump(permissions, many=True)
    return jsonify({
        'total': len(permissions),
        'results': permissions
    })


@blueprint.route('/api/2/collections/<int:id>/permissions',
                 methods=['POST', 'PUT'])
def update(id):
    collection = get_db_collection(id, request.authz.WRITE)
    for permission in parse_request(PermissionSchema, many=True):
        role_id = permission.get('role', {}).get('id')
        role = Role.by_id(role_id)
        if not check_visible(role, request.authz):
            continue
        if collection.casefile and role.is_public:
            permission['read'] = False
            permission['write'] = False

        update_permission(role,
                          collection,
                          permission['read'],
                          permission['write'],
                          editor_id=request.authz.id)
    update_collection(collection)
    return index(id)
