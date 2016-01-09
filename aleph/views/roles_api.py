from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, request_data, jsonify

from aleph.model import Role, Permission
from aleph.core import db
from aleph.validation import validate
from aleph import authz

permissions_schema = 'https://aleph.grano.cc/operational/permission.json#'
blueprint = Blueprint('roles', __name__)


@blueprint.route('/api/1/roles', methods=['GET'])
def index():
    authz.require(authz.logged_in())
    users = []
    for role in db.session.query(Role):
        data = role.to_dict()
        del data['email']
        users.append(data)
    return jsonify({'results': users, 'total': len(users)})


@blueprint.route('/api/1/roles/<int:id>', methods=['GET'])
def view(id):
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


@blueprint.route('/api/1/watchlists/<int:watchlist>/permissions')
def watchlist_permissions_index(watchlist=None):
    authz.require(authz.watchlist_write(watchlist))
    q = db.session.query(Permission)
    q = q.filter(Permission.resource_type == Permission.COLLECTION)
    q = q.filter(Permission.resource_id == watchlist)
    return jsonify({
        'total': q.count(),
        'results': q
    })


@blueprint.route('/api/1/sources/<int:source>/permissions')
def source_permissions_index(source=None):
    q = db.session.query(Permission)
    authz.require(authz.source_write(source))
    q = q.filter(Permission.resource_type == Permission.SOURCE)
    q = q.filter(Permission.resource_id == source)
    return jsonify({
        'total': q.count(),
        'results': q
    })


@blueprint.route('/api/1/watchlists/<int:watchlist>/permissions',
                 methods=['POST', 'PUT'])
@blueprint.route('/api/1/sources/<int:source>/permissions',
                 methods=['POST', 'PUT'])
def permissions_save(watchlist=None, source=None):
    if watchlist is not None:
        authz.require(authz.watchlist_write(watchlist))
    if source is not None:
        authz.require(authz.source_write(source))

    resource_type = Permission.WATCHLIST if watchlist else Permission.SOURCE
    resource_id = watchlist or source
    data = request_data()
    validate(data, permissions_schema)

    role = db.session.query(Role).filter(Role.id == data['role']).first()
    if role is None:
        raise BadRequest()

    permission = Permission.grant_resource(resource_type, resource_id, role,
                                           data['read'], data['write'])
    db.session.commit()
    return jsonify({
        'status': 'ok',
        'updated': permission
    })
