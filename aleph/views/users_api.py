from flask import Blueprint
from flask.ext.login import current_user
from apikit import obj_or_404, request_data, jsonify

from aleph.model import User
from aleph.core import db
from aleph import authz


blueprint = Blueprint('users', __name__)


@blueprint.route('/api/1/users', methods=['GET'])
def index():
    authz.require(authz.logged_in())
    users = []
    for user in User.all():
        data = user.to_dict()
        del data['email']
        users.append(data)
    return jsonify({'results': users, 'total': len(users)})


@blueprint.route('/api/1/users/<id>', methods=['GET'])
def view(id):
    user = obj_or_404(User.by_id(id))
    data = user.to_dict()
    if user.id != current_user.id:
        del data['email']
    return jsonify(data)


@blueprint.route('/api/1/users/<id>', methods=['POST', 'PUT'])
def update(id):
    user = obj_or_404(User.by_id(id))
    authz.require(user.id == current_user.id)
    user.update(request_data())
    db.session.add(user)
    db.session.commit()
    return jsonify(user)
