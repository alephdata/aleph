import logging
from flask import Blueprint, request

from aleph.model import Collection
from aleph.logic.dashboard import get_active_collection_status
from aleph.views.util import jsonify
from aleph.logic import resolver
from aleph.views.util import require


log = logging.getLogger(__name__)
blueprint = Blueprint('dashboard_api', __name__)


@blueprint.route('/api/2/dashboard', methods=['GET'])
def dashboard():
    require(request.authz.logged_in)
    status = get_active_collection_status()
    active_collections = status['datasets']
    active_foreign_ids = set(active_collections.keys())
    collections = request.authz.collections(request.authz.READ)
    for collection_id in collections:
        resolver.queue(request, Collection, collection_id)
    resolver.resolve(request)
    for collection_id in collections:
        data = resolver.get(request, Collection, collection_id)
        if data is None:
            continue
        fid = data['foreign_id']
        if fid in active_foreign_ids:
            active_collections[fid]['collection'] = data
    return jsonify(status)
