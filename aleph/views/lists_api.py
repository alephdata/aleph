from flask import Blueprint  # , request
from flask.ext.login import current_user

from aleph.views.util import obj_or_404, jsonify, Pager
from aleph.model import List
from aleph import authz

blueprint = Blueprint('lists', __name__)


@blueprint.route('/api/1/lists', methods=['GET'])
def index():
    q = List.all_by_user(current_user)
    return jsonify(Pager(q))


@blueprint.route('/api/1/lists/<int:id>', methods=['GET'])
def view(id):
    authz.require(authz.list_read(id))
    lst = obj_or_404(List.by_id(id))
    return jsonify(lst)
