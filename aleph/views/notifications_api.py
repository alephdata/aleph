from flask import Blueprint, request

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
