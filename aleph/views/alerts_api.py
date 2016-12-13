from flask import Blueprint, request
from apikit import obj_or_404, request_data, jsonify

from aleph.core import db
from aleph.model import Alert
from aleph.events import log_event
from aleph.views.cache import enable_cache

blueprint = Blueprint('alerts_api', __name__)


@blueprint.route('/api/1/alerts', methods=['GET'])
def index():
    if request.authz.logged_in:
        alerts = Alert.by_role(request.authz.role).all()
        return jsonify({'results': alerts, 'total': len(alerts)})
    return jsonify({'results': [], 'total': 0})


@blueprint.route('/api/1/alerts', methods=['POST', 'PUT'])
def create():
    request.authz.require(request.authz.session_write())
    alert = Alert.create(request_data(), request.authz.role)
    db.session.commit()
    log_event(request)
    return view(alert.id)


@blueprint.route('/api/1/alerts/<int:id>', methods=['GET'])
def view(id):
    enable_cache(vary_user=True)
    request.authz.require(request.authz.logged_in)
    alert = obj_or_404(Alert.by_id(id, role=request.authz.role))
    return jsonify(alert)


@blueprint.route('/api/1/alerts/<int:id>', methods=['DELETE'])
def delete(id):
    request.authz.require(request.authz.session_write())
    alert = obj_or_404(Alert.by_id(id, role=request.authz.role))
    alert.delete()
    db.session.commit()
    log_event(request)
    return jsonify({'status': 'ok'})
