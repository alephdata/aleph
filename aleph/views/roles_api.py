from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from itsdangerous import BadSignature

from aleph.core import db, settings, app_ui_url
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.model import Role, Permission
from aleph.logic.roles import check_visible, check_editable
from aleph.logic.permissions import update_permission
from aleph.notify import notify_role_template
from aleph.serializers.roles import RoleSchema, PermissionSchema
from aleph.serializers.roles import RoleCodeCreateSchema, RoleCreateSchema
from aleph.views.util import require, get_db_collection, jsonify, parse_request
from aleph.views.util import obj_or_404

blueprint = Blueprint('roles_api', __name__)


@blueprint.route('/api/2/roles/_suggest', methods=['GET'])
def suggest():
    require(request.authz.logged_in)
    parser = QueryParser(request.args, request.authz, limit=10)
    if parser.prefix is None or len(parser.prefix) < 3:
        # Do not return 400 because it's a routine event.
        return jsonify({
            'status': 'error',
            'message': 'prefix filter is too short',
            'results': [],
            'total': 0
        })
    # this only returns users, not groups
    q = Role.by_prefix(parser.prefix)
    result = DatabaseQueryResult(request, q, parser=parser, schema=RoleSchema)
    return jsonify(result)


@blueprint.route('/api/2/roles/code', methods=['POST'])
def create_code():
    data = parse_request(schema=RoleCodeCreateSchema)
    signature = Role.SIGNATURE.dumps(data['email'])
    url = '{}activate/{}'.format(app_ui_url, signature)
    role = Role(email=data['email'], name='Visitor')
    notify_role_template(role, 'Registration',
                         'email/registration_code.html',
                         url=url)
    return jsonify({
        'status': 'ok',
        'message': 'To proceed, please check your email.'
    })


@blueprint.route('/api/2/roles', methods=['POST'])
def create():
    require(not request.authz.in_maintenance, settings.PASSWORD_LOGIN)
    data = parse_request(schema=RoleCreateSchema)

    try:
        email = Role.SIGNATURE.loads(data.get('code'),
                                     max_age=Role.SIGNATURE_MAX_AGE)
    except BadSignature:
        return jsonify({
            'status': 'error',
            'message': 'Invalid code'
        }, status=400)

    role = Role.by_email(email).first()
    if role is not None:
        return jsonify({
            'status': 'error',
            'message': 'Email is already registered'
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
    # Let the serializer return more info about this user
    request.authz.id = role.id
    return jsonify(role, schema=RoleSchema, status=201)


@blueprint.route('/api/2/roles/<int:id>', methods=['GET'])
def view(id):
    role = obj_or_404(Role.by_id(id))
    require(check_editable(role, request.authz))
    return jsonify(role, schema=RoleSchema)


@blueprint.route('/api/2/roles/<int:id>', methods=['POST', 'PUT'])
def update(id):
    role = obj_or_404(Role.by_id(id))
    require(request.authz.session_write)
    require(check_editable(role, request.authz))
    data = parse_request(schema=RoleSchema)
    role.update(data)
    db.session.add(role)
    db.session.commit()
    return view(role.id)


@blueprint.route('/api/2/collections/<int:id>/permissions')
def permissions_index(id):
    collection = get_db_collection(id, request.authz.WRITE)
    q = Permission.all()
    q = q.filter(Permission.collection_id == collection.id)
    permissions = []
    roles = [r for r in Role.all_groups() if check_visible(r, request.authz)]
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
        permissions.append({
            'collection_id': collection.id,
            'write': False,
            'read': False,
            'role': role
        })

    return jsonify({
        'total': len(permissions),
        'results': PermissionSchema().dump(permissions, many=True)
    })


@blueprint.route('/api/2/collections/<int:id>/permissions',
                 methods=['POST', 'PUT'])
def permissions_update(id):
    # TODO: consider using a list to bundle permission writes
    collection = get_db_collection(id, request.authz.WRITE)
    data = parse_request(schema=PermissionSchema)
    role = Role.all().filter(Role.id == data['role']['id']).first()
    if role is None or not check_visible(role, request.authz):
        raise BadRequest()

    perm = update_permission(role,
                             collection,
                             data['read'],
                             data['write'])
    return jsonify({
        'status': 'ok',
        'updated': PermissionSchema().dump(perm)
    })
