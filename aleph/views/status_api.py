import logging
from flask import Blueprint, request

from aleph.model import Collection
from aleph.queues import get_active_collection_status
from aleph.views.serializers import CollectionSerializer
from aleph.views.util import jsonify, require

log = logging.getLogger(__name__)
blueprint = Blueprint("status_api", __name__)


@blueprint.route("/api/2/status", methods=["GET"])
def status():
    """
    ---
    get:
      summary: Get an overview of collections being processed
      description: >
        List collections being processed currently and pending task counts
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SystemStatusResponse'
      tags:
      - System
    """
    require(request.authz.logged_in)
    request.rate_limit = None
    status = get_active_collection_status()
    active_collections = status.pop("datasets", [])
    active_foreign_ids = set(active_collections.keys())
    collections = request.authz.collections(request.authz.READ)
    serializer = CollectionSerializer(reference=True)
    results = []
    for fid in sorted(active_foreign_ids):
        collection = Collection.by_foreign_id(fid)
        if collection is None:
            continue
        if collection.id in collections:
            result = active_collections[fid]
            result["collection"] = serializer.serialize(collection.to_dict())
            result["id"] = fid
            results.append(result)
    return jsonify({"results": results, "total": len(results)})
