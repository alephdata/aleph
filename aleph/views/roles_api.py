from flask import Blueprint, request, abort, render_template
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, request_data, jsonify

from aleph.core import db, get_config, app_url
from aleph.events import log_event
from aleph.model import Role, Collection, Permission
from aleph.logic.permissions import update_permission
from aleph.data.validate import validate
from aleph.notify import notify_role


blueprint = Blueprint('roles_api', __name__)


def check_visible(role):
    """Users should not see group roles which they are not a part of."""
    if request.authz.is_admin or role.id in request.authz.roles:
        return True
    return role.type == Role.USER


@blueprint.route('/api/1/roles', methods=['GET'])
def index():
    request.authz.require(request.authz.logged_in)
    users = []
    for role in Role.all():
        if not check_visible(role):
            continue
        data = role.to_dict()
        del data['email']
        users.append(data)
    return jsonify({'results': users, 'total': len(users)})


@blueprint.route('/api/1/roles/invite', methods=['POST'])
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


@blueprint.route('/api/1/roles', methods=['POST'])
def create():
    data = request_data()
    email = data.get('email')
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

    role = Role.load_or_create(
        foreign_id='password:{}'.format(email),
        type=Role.USER,
        name=email,
        email=email
    )
    role.set_password(password)

    db.session.add(role)
    db.session.flush()

    return jsonify(dict(role=role.to_dict())), 201


@blueprint.route('/api/1/roles/<int:id>', methods=['GET'])
def view(id):
    role = obj_or_404(Role.by_id(id))
    request.authz.require(request.authz.logged_in)
    request.authz.require(check_visible(role))
    data = role.to_dict()
    if role.id != request.authz.role.id:
        del data['email']
    return jsonify(data)


@blueprint.route('/api/1/roles/<int:id>', methods=['POST', 'PUT'])
def update(id):
    role = obj_or_404(Role.by_id(id))
    request.authz.require(request.authz.session_write())
    request.authz.require(role.id == request.authz.role.id)
    role.update(request_data())
    db.session.add(role)
    db.session.commit()
    log_event(request)
    return jsonify(role)


@blueprint.route('/api/1/collections/<int:collection>/permissions')
def permissions_index(collection):
    request.authz.require(request.authz.collection_write(collection))
    q = Permission.all()
    q = q.filter(Permission.collection_id == collection)
    permissions = []
    for permission in q.all():
        if check_visible(permission.role):
            permissions.append(permission)
    return jsonify({
        'total': len(permissions),
        'results': permissions
    })


@blueprint.route('/api/1/collections/<int:collection>/permissions',
                 methods=['POST', 'PUT'])
def permissions_update(collection):
    request.authz.require(request.authz.collection_write(collection))
    data = request_data()
    validate(data, 'permission.json#')

    role = Role.all().filter(Role.id == data['role']).first()
    collection = Collection.by_id(collection)
    if role is None or collection is None:
        raise BadRequest()
    request.authz.require(check_visible(role))

    perm = update_permission(role, collection, data['read'], data['write'])
    log_event(request)
    return jsonify({
        'status': 'ok',
        'updated': perm
    })
