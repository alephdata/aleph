from datetime import datetime
from flask import Blueprint, request

from aleph.core import db
from aleph.model import Notification, Role
from aleph.search import DatabaseQueryResult
from aleph.logic.notifications import channel
from aleph.views.serializers import NotificationSerializer
from aleph.views.util import get_db_collection
from aleph.views.util import jsonify, require


blueprint = Blueprint('notifications_api', __name__)


@blueprint.route('/api/2/notifications', methods=['GET'])
def index():
    require(request.authz.logged_in)
    role = Role.by_id(request.authz.id)
    require(role is not None)
    query = Notification.by_role(role)
    result = DatabaseQueryResult(request, query)
    return NotificationSerializer.jsonify_result(result)


@blueprint.route('/api/2/collections/<id>/notifications', methods=['GET'])
def collection(id):
    require(request.authz.logged_in)
    collection = get_db_collection(id)
    channel_name = channel(collection)
    query = Notification.by_channel(channel_name)
    result = DatabaseQueryResult(request, query)
    return NotificationSerializer.jsonify_result(result)


@blueprint.route('/api/2/notifications', methods=['DELETE'])
def mark_read():
    require(request.authz.logged_in)
    role = Role.by_id(request.authz.id)
    role.notified_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'ok'}, status=202)
