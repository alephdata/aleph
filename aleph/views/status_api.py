import logging
from flask import Blueprint, request

from servicelayer.taskqueue import collection_id_from_dataset

from aleph.model import Collection
from aleph.queues import get_active_dataset_status
from aleph.views.serializers import CollectionSerializer
from aleph.views.util import jsonify, require

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
    require(request.authz.logged_in)
    request.rate_limit = None
    status = get_active_dataset_status()
    datasets = status.pop("datasets", {})
    collections = (collection_id_from_dataset(d) for d in datasets.keys())
    collections = (c for c in collections if c is not None)
    collections = Collection.all_by_ids(collections, deleted=True).all()
    collections = {c.id: c for c in collections}
    serializer = CollectionSerializer(nested=True)
    results = []
    for dataset, status in sorted(datasets.items()):
        collection_id = collection_id_from_dataset(dataset)
        if not request.authz.can(collection_id, request.authz.READ):
            continue
        collection = collections.get(collection_id)
        if collection is not None:
            status["collection"] = serializer.serialize(collection.to_dict())
        results.append(status)
    return jsonify({"results": results, "total": len(results)})
