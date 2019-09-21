import logging
from flask import Blueprint, request

from aleph.model import Collection
from aleph.queues import get_active_collection_status
from aleph.views.util import jsonify
from aleph.views.util import require


log = logging.getLogger(__name__)
blueprint = Blueprint('status_api', __name__)


@blueprint.route('/api/2/status', methods=['GET'])
def status():
    require(request.authz.logged_in)
    status = get_active_collection_status()
    active_collections = status.pop('datasets', [])
    active_foreign_ids = set(active_collections.keys())
    collections = request.authz.collections(request.authz.READ)
    results = []
    for fid in sorted(active_foreign_ids):
        collection = Collection.by_foreign_id(fid)
        if collection is None:
            continue
        if collection.id in collections:
            result = active_collections[fid]
            result['collection'] = collection.to_dict()
            result['id'] = fid
            results.append(result)
    return jsonify({
        'results': results,
        'total': len(results)
    })
