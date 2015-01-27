from flask import Blueprint
from flask.ext.login import current_user

from aleph.views.util import obj_or_404, request_data, jsonify
from aleph.model import User
from aleph.core import db
from aleph import authz


blueprint = Blueprint('users', __name__)


@blueprint.route('/api/1/users/<id>', methods=['GET'])
def view(id):
    account = obj_or_404(User.by_id(id))
    return jsonify(account)


@blueprint.route('/api/1/users/<id>', methods=['POST', 'PUT'])
def update(id):
    user = obj_or_404(User.by_id(id))
    authz.require(user.id == current_user.id)
    user.update(request_data())
    db.session.add(user)
    db.session.commit()
    return jsonify(user)
