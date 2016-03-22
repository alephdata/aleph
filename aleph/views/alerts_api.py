from flask import Blueprint, request
from apikit import obj_or_404, request_data, jsonify

from aleph import authz
from aleph.core import db
from aleph.model import Alert
from aleph.views.cache import enable_cache

blueprint = Blueprint('alerts_api', __name__)


@blueprint.route('/api/1/alerts', methods=['GET'])
def index():
    authz.require(authz.logged_in())
    alerts = Alert.by_role(request.auth_role).all()
    return jsonify({'results': alerts, 'total': len(alerts)})


@blueprint.route('/api/1/alerts', methods=['POST', 'PUT'])
def create():
    authz.require(authz.logged_in())
    alert = Alert.create(request_data(),
                         request.auth_role)
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
