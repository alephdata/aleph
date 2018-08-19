from flask import Blueprint, request

from aleph.core import db
from aleph.model import Alert
from aleph.search import DatabaseQueryResult
from aleph.serializers.alerts import AlertSchema
from aleph.views.util import require, obj_or_404, jsonify
from aleph.views.util import parse_request, serialize_data

blueprint = Blueprint('alerts_api', __name__)


@blueprint.route('/api/2/alerts', methods=['GET'])
def index():
    require(request.authz.logged_in)
    query = Alert.by_role_id(request.authz.id)
    result = DatabaseQueryResult(request, query, schema=AlertSchema)
    return jsonify(result)


@blueprint.route('/api/2/alerts', methods=['POST', 'PUT'])
def create():
    require(request.authz.session_write)
    data = parse_request(AlertSchema)
    alert = Alert.create(data, request.authz.id)
    db.session.commit()
    return view(alert.id)


@blueprint.route('/api/2/alerts/<int:id>', methods=['GET'])
def view(id):
    require(request.authz.logged_in)
    alert = obj_or_404(Alert.by_id(id, role_id=request.authz.id))
    return serialize_data(alert, AlertSchema)


@blueprint.route('/api/2/alerts/<int:id>', methods=['DELETE'])
def delete(id):
    require(request.authz.session_write)
    alert = obj_or_404(Alert.by_id(id, role_id=request.authz.id))
    alert.delete()
    db.session.commit()
    return ('', 204)
