import logging
from flask import Blueprint, request

from aleph.model import Role
from aleph.views.serializers import RoleSerializer
from aleph.views.util import require, jsonify

blueprint = Blueprint('groups_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/groups', methods=['GET'])
def index():
    require(request.authz.logged_in)
    q = Role.all_groups(request.authz)
    return jsonify({
        'total': q.count(),
        'results': RoleSerializer().serialize_many(q.all())
    })
