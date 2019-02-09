import logging
from flask_babel import gettext
from flask import Blueprint, request
from itsdangerous import BadSignature

from aleph.core import db, settings
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.model import Role
from aleph.logic.roles import check_editable, update_role
from aleph.notify import notify_role
from aleph.serializers.roles import RoleSchema
from aleph.serializers.roles import RoleCodeCreateSchema, RoleCreateSchema
from aleph.views.util import require, jsonify, parse_request
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
    return serialize_data(role, RoleSchema)
