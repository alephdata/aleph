from flask import Blueprint, request
from apikit import obj_or_404, request_data, jsonify

from aleph import authz
from aleph.model import Alert
from aleph.core import db
from aleph.validation import validate
from aleph.views.cache import enable_cache

alerts_schema = 'https://aleph.grano.cc/operational/alert.json#'
blueprint = Blueprint('alerts', __name__)


@blueprint.route('/api/1/alerts', methods=['GET'])
def index():
    authz.require(authz.logged_in())
    alerts = Alert.all(role=request.auth_role).all()
    return jsonify({'results': alerts, 'total': len(alerts)})


@blueprint.route('/api/1/alerts', methods=['POST', 'PUT'])
def create():
    authz.require(authz.logged_in())
    data = request_data()
    validate(data, alerts_schema)
    alert = Alert.create(data.get('query', {}), request.auth_role)
    db.session.commit()
    return view(alert.id)


@blueprint.route('/api/1/alerts/<int:id>', methods=['GET'])
def view(id):
    enable_cache(vary_user=True)
    authz.require(authz.logged_in())
    alert = obj_or_404(Alert.by_id(id, role=request.auth_role))
    return jsonify(alert)


@blueprint.route('/api/1/alerts/<int:id>', methods=['DELETE'])
def delete(id):
    authz.require(authz.logged_in())
    alert = obj_or_404(Alert.by_id(id, role=request.auth_role))
    alert.delete()
    db.session.commit()
    return jsonify({'status': 'ok'})
