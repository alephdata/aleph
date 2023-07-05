import logging
from flask import Blueprint, request, abort

from aleph.model import Collection
from aleph.queues import get_active_dataset_status, get_dataset_collection_id
from aleph.views.serializers import CollectionSerializer

log = logging.getLogger(__name__)
blueprint = Blueprint("status_api", __name__)


@blueprint.route("/api/2/status", methods=["GET"])
def status():
    """
    ---
    get:
      summary: Get an overview of collections and exports being processed
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
    if not request.authz.logged_in:
        abort(401)
    request.rate_limit = None
    status = get_active_dataset_status()
    datasets = status.pop("datasets", {})
    collections = (get_dataset_collection_id(d) for d in datasets.keys())
    collections = (c for c in collections if c is not None)
    collections = Collection.all_by_ids(collections, deleted=True).all()
    collections = {c.id: c for c in collections}
    serializer = CollectionSerializer(nested=True)
    results = []
    for dataset, status in sorted(datasets.items()):
        collection_id = get_dataset_collection_id(dataset)
        if not request.authz.can(collection_id, request.authz.READ):
            continue
        collection = collections.get(collection_id)
        if collection is not None:
            status["collection"] = serializer.serialize(collection.to_dict())
        results.append(status)
    return {"results": results, "total": len(results)}
