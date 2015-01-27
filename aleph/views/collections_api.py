from flask import Blueprint
from flask.ext.login import current_user

from aleph.views.util import obj_or_404, request_data, jsonify
from aleph.model import Collection
from aleph.core import db
from aleph import authz


blueprint = Blueprint('collections', __name__)


@blueprint.route('/api/1/collections', methods=['GET'])
def index():
    collections = Collection.all_by_user(current_user)
    return jsonify({'results': collections, 'total': collections.count()})


@blueprint.route('/api/1/collections/<slug>', methods=['GET'])
def view(slug):
    authz.require(authz.collection_read(slug))
    collection = obj_or_404(Collection.by_slug(slug))
    return jsonify(collection)


# @blueprint.route('/api/1/users/<id>', methods=['POST', 'PUT'])
# def update(id):
#     user = obj_or_404(User.by_id(id))
#     authz.require(user.id == current_user.id)
#     data = request_data()
#     user.display_name = data.get('display_name')
#     user.email = data.get('email')
#     db.session.add(user)
#     db.session.commit()
#     return jsonify(user)
