import logging
from flask import Blueprint, request
from itsdangerous import BadSignature
from flask.ext.babel import gettext

from aleph.core import db, settings
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.model import Role, Permission, Audit
from aleph.logic.roles import check_visible, check_editable, update_role
from aleph.logic.permissions import update_permission
from aleph.logic.collections import update_collection, update_collection_access
from aleph.notify import notify_role
from aleph.logic.audit import record_audit
from aleph.serializers.roles import RoleSchema, PermissionSchema
from aleph.serializers.roles import RoleCodeCreateSchema, RoleCreateSchema
from aleph.views.util import require, get_db_collection, jsonify, parse_request
from aleph.views.util import obj_or_404, serialize_data

blueprint = Blueprint('roles_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/roles/_suggest', methods=['GET'])
def suggest():
    require(request.authz.logged_in)
    parser = QueryParser(request.args, request.authz, limit=10)
    if parser.prefix is None or len(parser.prefix) < 3:
        # Do not return 400 because it's a routine event.
        return jsonify({
            'status': 'error',
            'message': gettext('prefix filter is too short'),
            'results': [],
            'total': 0
        })
    # this only returns users, not groups
    q = Role.by_prefix(parser.prefix, exclude=parser.exclude)
    result = DatabaseQueryResult(request, q, parser=parser, schema=RoleSchema)
    return jsonify(result)


@blueprint.route('/api/2/roles/code', methods=['POST'])
def create_code():
    data = parse_request(RoleCodeCreateSchema)
    signature = Role.SIGNATURE.dumps(data['email'])
    url = '{}activate/{}'.format(settings.APP_UI_URL, signature)
    role = Role(email=data['email'], name='Visitor')
    log.info("Confirmation URL [%r]: %s", role, url)
    notify_role(role, gettext('Registration'),
                'email/registration_code.html',
                url=url)
    return jsonify({
        'status': 'ok',
        'message': gettext('To proceed, please check your email.')
    })


@blueprint.route('/api/2/roles', methods=['POST'])
def create():
    require(not request.authz.in_maintenance, settings.PASSWORD_LOGIN)
    data = parse_request(RoleCreateSchema)

    try:
        email = Role.SIGNATURE.loads(data.get('code'),
                                     max_age=Role.SIGNATURE_MAX_AGE)
    except BadSignature:
        return jsonify({
            'status': 'error',
            'message': gettext('Invalid code')
        }, status=400)

    role = Role.by_email(email)
    if role is not None:
        return jsonify({
            'status': 'error',
            'message': gettext('Email is already registered')
        }, status=409)

    role = Role.load_or_create(
        foreign_id='password:{}'.format(email),
        type=Role.USER,
        name=data.get('name') or email,
        email=email
    )
    role.set_password(data.get('password'))
    db.session.add(role)
    db.session.commit()
    update_role(role)
    # Let the serializer return more info about this user
    request.authz.id = role.id
    return serialize_data(role, RoleSchema, status=201)


@blueprint.route('/api/2/roles/<int:id>', methods=['GET'])
def view(id):
    role = obj_or_404(Role.by_id(id))
    require(check_editable(role, request.authz))
    return serialize_data(role, RoleSchema)


@blueprint.route('/api/2/roles/<int:id>', methods=['POST', 'PUT'])
def update(id):
    role = obj_or_404(Role.by_id(id))
    require(request.authz.session_write)
    require(check_editable(role, request.authz))
    data = parse_request(RoleSchema)
    role.update(data)
    db.session.add(role)
    db.session.commit()
    update_role(role)
    return view(role.id)


@blueprint.route('/api/2/collections/<int:id>/permissions')
def permissions_index(id):
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
def permissions_update(id):
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

    update_collection_access.delay(id)
    update_collection(collection)
    return permissions_index(id)
