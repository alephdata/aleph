from flask import Blueprint, request
from apikit import obj_or_404, request_data, jsonify

from aleph.core import db
from aleph.model import Alert
from aleph.search import DatabaseQueryResult
from aleph.views.util import require

blueprint = Blueprint('alerts_api', __name__)


@blueprint.route('/api/2/alerts', methods=['GET'])
def index():
    require(request.authz.logged_in)
    query = Alert.by_role(request.authz.role)
    result = DatabaseQueryResult(request, query)
    return jsonify(result)


@blueprint.route('/api/2/alerts', methods=['POST', 'PUT'])
def create():
    require(request.authz.session_write)
    alert = Alert.create(request_data(), request.authz.role)
    db.session.commit()
    return view(alert.id)


@blueprint.route('/api/2/alerts/<int:id>', methods=['GET'])
def view(id):
    require(request.authz.logged_in)
    alert = obj_or_404(Alert.by_id(id, role=request.authz.role))
    return jsonify(alert)


@blueprint.route('/api/2/alerts/<int:id>', methods=['DELETE'])
def delete(id):
    require(request.authz.session_write)
    alert = obj_or_404(Alert.by_id(id, role=request.authz.role))
    alert.delete()
    db.session.commit()
    return jsonify({'status': 'ok'})
