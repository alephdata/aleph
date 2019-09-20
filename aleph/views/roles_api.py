import logging
from flask_babel import gettext
from flask import Blueprint, request
from itsdangerous import BadSignature

from aleph.core import db, settings
from aleph.authz import Authz
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.model import Role
from aleph.logic.roles import challenge_role, update_role
from aleph.views.forms import RoleSchema
from aleph.views.forms import RoleCodeCreateSchema, RoleCreateSchema
from aleph.views.serializers import RoleSerializer
from aleph.views.util import require, jsonify, parse_request, obj_or_404
from aleph.views.context import tag_request

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
    result = DatabaseQueryResult(request, q, parser=parser)
    return RoleSerializer.jsonify_result(result)


@blueprint.route('/api/2/roles/code', methods=['POST'])
def create_code():
    require(settings.PASSWORD_LOGIN)
    require(not request.authz.in_maintenance)
    data = parse_request(RoleCodeCreateSchema)
    challenge_role(data)
    return jsonify({
        'status': 'ok',
        'message': gettext('To proceed, please check your email.')
    })


@blueprint.route('/api/2/roles', methods=['POST'])
def create():
    require(settings.PASSWORD_LOGIN)
    require(not request.authz.in_maintenance)
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
    request.authz = Authz.from_role(role)
    tag_request(role_id=role.id)
    return RoleSerializer.jsonify(role, status=201)


@blueprint.route('/api/2/roles/<int:id>', methods=['GET'])
def view(id):
    role = obj_or_404(Role.by_id(id))
    require(request.authz.can_read_role(role.id))
    return RoleSerializer.jsonify(role)


@blueprint.route('/api/2/roles/<int:id>', methods=['POST', 'PUT'])
def update(id):
    role = obj_or_404(Role.by_id(id))
    require(request.authz.can_write_role(role.id))
    data = parse_request(RoleSchema)
    role.update(data)
    db.session.add(role)
    db.session.commit()
    update_role(role)
    return RoleSerializer.jsonify(role)
