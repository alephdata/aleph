from flask import Blueprint, request, abort, render_template
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, request_data, jsonify

from aleph.core import db, get_config, app_url
from aleph.events import log_event
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.model import Role, Permission
from aleph.logic.permissions import update_permission
from aleph.model.validate import validate
from aleph.notify import notify_role
from aleph.views.util import require, get_collection


blueprint = Blueprint('roles_api', __name__)


def check_visible(role):
    """Users should not see group roles which they are not a part of."""
    if request.authz.is_admin or role.id in request.authz.roles:
        return True
    return role.type == Role.USER


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
    result = DatabaseQueryResult(request, q, parser=parser)
    return jsonify(result)


@blueprint.route('/api/2/roles/invite', methods=['POST'])
def invite_email():
    data = request_data()
    email = data.get('email')

    if not email:
        abort(400)

    signature = Role.SIGNATURE_SERIALIZER.dumps(email, salt=email)
    url = '{}signup/{}'.format(app_url, signature)
    role = Role(email=email, name='Visitor')

    notify_role(role=role, subject='Registration', html=render_template(
        'email/registration_invitation.html', url=url, role=role)
    )

    return jsonify({'status': 'To proceed, please check your email.'}), 201


@blueprint.route('/api/2/roles', methods=['POST'])
def create():
    require(not request.authz.in_maintenance)
    data = request_data()
    email = data.get('email')
    name = data.get('name') or email
    password = data.get('password')
    signature = data.get('code')

    if not email or not password or not signature:
        abort(400)

    try:
        # Make sure registration is allowed
        assert get_config('PASSWORD_REGISTRATION')

        # Make sure password is set and not too short
        assert len(password) >= Role.PASSWORD_MIN_LENGTH

        # Make sure the signature is valid
        assert email == Role.SIGNATURE_SERIALIZER.loads(
            signature, salt=email, max_age=Role.SIGNATURE_MAX_AGE)
    except:
        abort(400)

    role = Role.by_email(email).first()

    if role:
        return jsonify(dict(status='ok')), 200

    role = Role.load_or_create(
        foreign_id='password:{}'.format(email),
        type=Role.USER,
        name=name,
        email=email
    )
    role.set_password(password)

    db.session.add(role)
    db.session.commit()

    return jsonify({'status': 'ok'}, status=201)


@blueprint.route('/api/2/roles/<int:id>', methods=['GET'])
def view(id):
    role = obj_or_404(Role.by_id(id))
    require(request.authz.logged_in,
            check_visible(role))
    data = role.to_dict()
    if role.id == request.authz.role.id:
        data['email'] = role.email
    return jsonify(data)


@blueprint.route('/api/2/roles/<int:id>', methods=['POST', 'PUT'])
def update(id):
    role = obj_or_404(Role.by_id(id))
    require(request.authz.session_write,
            role.id == request.authz.role.id)
    role.update(request_data())
    db.session.add(role)
    db.session.commit()
    log_event(request)
    return jsonify(role)


@blueprint.route('/api/2/collections/<int:id>/permissions')
def permissions_index(id):
    collection = get_collection(id, request.authz.WRITE)
    q = Permission.all()
    q = q.filter(Permission.collection_id == collection.id)
    permissions = []
    roles_seen = set()
    for permission in q.all():
        if check_visible(permission.role):
            permissions.append(permission)
            roles_seen.add(permission.role.id)

    # this workaround ensures that all groups are visible for the user to
    # select in the UI even if they are not currently associated with the
    # collection.
    for role in Role.all_groups():
        if check_visible(role):
            if role.id not in roles_seen:
                roles_seen.add(role.id)
                permissions.append({
                    'write': False,
                    'read': False,
                    'role': role
                })

    return jsonify({
        'total': len(permissions),
        'results': permissions
    })


@blueprint.route('/api/2/collections/<int:id>/permissions',
                 methods=['POST', 'PUT'])
def permissions_update(id):
    collection = get_collection(id, request.authz.WRITE)
    data = request_data()
    validate(data, 'permission.json#')

    role_id = data.get('role', {}).get('id')
    role = Role.all().filter(Role.id == role_id).first()
    if role is None or not check_visible(role):
        raise BadRequest()

    perm = update_permission(role, collection, data['read'], data['write'])
    log_event(request)
    return jsonify({
        'status': 'ok',
        'updated': perm
    })
