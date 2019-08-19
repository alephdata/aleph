from flask import Blueprint, request, abort

from aleph.logic.dashboard import get_active_collection_status
from aleph.views.util import jsonify

blueprint = Blueprint('collections_api', __name__)


@blueprint.route('/api/2/dashboard', methods=['GET'])
def dashboard():
    if request.authz.is_admin:
        result = get_active_collection_status()
        return jsonify(result)
    return abort(403)
