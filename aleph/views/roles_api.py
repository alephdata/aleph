from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, request_data, jsonify

from aleph import authz
from aleph.core import db
from aleph.model import Role, Permission, validate


blueprint = Blueprint('roles_api', __name__)


@blueprint.route('/api/1/roles', methods=['GET'])
def index():
    authz.require(authz.logged_in())
    users = []
    for role in Role.all():
        data = role.to_dict()
        del data['email']
        users.append(data)
    return jsonify({'results': users, 'total': len(users)})


@blueprint.route('/api/1/roles/<int:id>', methods=['GET'])
def view(id):
    authz.require(authz.logged_in())
    role = obj_or_404(Role.by_id(id))
    data = role.to_dict()
    if role.id != request.auth_role.id:
        del data['email']
    return jsonify(data)


@blueprint.route('/api/1/roles/<int:id>', methods=['POST', 'PUT'])
def update(id):
    role = obj_or_404(Role.by_id(id))
    authz.require(authz.logged_in())
    authz.require(role.id == request.auth_role.id)
    role.update(request_data())
    db.session.add(role)
    db.session.commit()
    return jsonify(role)


@blueprint.route('/api/1/collections/<int:collection>/permissions')
def permissions_index(collection):
    authz.require(authz.collection_write(collection))
    q = Permission.all()
    q = q.filter(Permission.collection_id == collection)
    return jsonify({
        'total': q.count(),
        'results': q
    })


@blueprint.route('/api/1/collections/<int:collection>/permissions',
                 methods=['POST', 'PUT'])
def permissions_update(collection):
    authz.require(authz.collection_write(collection))
    data = request_data()
    validate(data, 'permission.json#')

    role = Role.all().filter(Role.id == data['role']).first()
    if role is None:
        raise BadRequest()

    permission = Permission.grant_collection(collection,
                                             role,
                                             data['read'],
                                             data['write'])
    db.session.commit()
    return jsonify({
        'status': 'ok',
        'updated': permission
    })
