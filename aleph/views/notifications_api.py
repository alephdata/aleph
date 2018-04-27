from datetime import datetime
from flask import Blueprint, request

from aleph.core import db
from aleph.model import Notification, Role
from aleph.search import DatabaseQueryResult
from aleph.serializers.notifications import NotificationSchema
from aleph.views.util import jsonify, require


blueprint = Blueprint('notifications_api', __name__)


@blueprint.route('/api/2/notifications', methods=['GET'])
def index():
    require(request.authz.logged_in)
    role = Role.by_id(request.authz.id)
    query = Notification.by_role(role)
    result = DatabaseQueryResult(request, query, schema=NotificationSchema)
    return jsonify(result)


@blueprint.route('/api/2/notifications', methods=['DELETE'])
def mark_read():
    require(request.authz.logged_in)
    role = Role.by_id(request.authz.id)
    role.notified_at = datetime.utcnow()
    db.session.commit()
    return jsonify({'status': 'ok'}, status=202)
