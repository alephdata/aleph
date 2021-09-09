from banal import ensure_list
from flask import Blueprint, request

from aleph.core import db
from aleph.search import CollectionsQuery
from aleph.queues import queue_task, get_status, cancel_queue
from aleph.queues import OP_REINGEST, OP_REINDEX, OP_INDEX
from aleph.logic.collections import create_collection, update_collection
from aleph.logic.collections import delete_collection, refresh_collection
from aleph.logic.collections import get_deep_collection
from aleph.logic.entitysets import save_entityset_item
from aleph.index.collections import update_collection_stats
from aleph.logic.processing import bulk_write
from aleph.views.serializers import CollectionSerializer
from aleph.views.util import get_db_collection, get_index_collection, get_entityset
from aleph.views.util import require, parse_request, jsonify
from aleph.views.util import get_flag, get_session_id

blueprint = Blueprint("collections_api", __name__)


@blueprint.route("", methods=["GET"])
def index():
    """
    ---
    get:
      summary: List collections
      description: >-
        Returns a list of collections matching a given query. Returns all the
        collections accessible by a user if no query is given.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CollectionsResponse'
      tags:
      - Collection
    """
    require(request.authz.can_browse_anonymous)
    result = CollectionsQuery.handle(request)
    return CollectionSerializer.jsonify_result(result)


@blueprint.route("", methods=["POST", "PUT"])
def create():
    """
    ---
    post:
      summary: Create a collection
      description: Create a collection with the given metadata
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CollectionCreate'
      tags:
        - Collection
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Collection'
    """
    require(request.authz.logged_in)
    data = parse_request("CollectionCreate")
    sync = get_flag("sync", True)
    collection = create_collection(data, request.authz, sync=sync)
    return view(collection.get("id"))


@blueprint.route("/<int:collection_id>", methods=["GET"])
def view(collection_id):
    """
    ---
    get:
      summary: Get a collection
      description: Return the collection with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CollectionDeep'
      tags:
      - Collection
    """
    require(request.authz.can_browse_anonymous)
    data = get_index_collection(collection_id)
    cobj = get_db_collection(collection_id)
    if get_flag("refresh", False):
        update_collection_stats(collection_id, ["schema"])
    data.update(get_deep_collection(cobj))
    return CollectionSerializer.jsonify(data)


@blueprint.route("/<int:collection_id>", methods=["POST", "PUT"])
def update(collection_id):
    """
    ---
    post:
      summary: Update a collection
      description: >
        Change collection metadata and update statistics.
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CollectionUpdate'
      tags:
        - Collection
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Collection'
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    data = parse_request("CollectionUpdate")
    sync = get_flag("sync")
    collection.update(data, request.authz)
    db.session.commit()
    data = update_collection(collection, sync=sync)
    return CollectionSerializer.jsonify(data)


@blueprint.route("/<int:collection_id>/reingest", methods=["POST", "PUT"])
def reingest(collection_id):
    """
    ---
    post:
      summary: Re-ingest a collection
      description: >
        Trigger a process to re-parse the content of all documents stored
        in the collection with id `collection_id`.
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      - in: query
        name: index
        description: Index documents while they're being processed.
        schema:
          type: boolean
      responses:
        '202':
          description: Accepted
      tags:
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    index = get_flag("index", False)
    queue_task(collection, OP_REINGEST, job_id=get_session_id(), index=index)
    return ("", 202)


@blueprint.route("/<int:collection_id>/reindex", methods=["POST", "PUT"])
def reindex(collection_id):
    """
    ---
    post:
      summary: Re-index a collection
      description: >
        Re-index the entities in the collection with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      - in: query
        description: Delete the index before re-generating it.
        name: flush
        schema:
          type: boolean
      responses:
        '202':
          description: Accepted
      tags:
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    flush = get_flag("flush", False)
    queue_task(collection, OP_REINDEX, job_id=get_session_id(), flush=flush)
    return ("", 202)


@blueprint.route("/<int:collection_id>/_bulk", methods=["POST"])
@blueprint.route("/<int:collection_id>/bulk", methods=["POST"])
def bulk(collection_id):
    """
    ---
    post:
      summary: Load entities into a collection
      description: >
        Bulk load entities into the collection with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      - description: >-
          This will disable checksum security measures in order to allow bulk
          loading of document data.
        in: query
        name: unsafe
        schema:
          type: boolean
      requestBody:
        description: Entities to be loaded.
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/EntityUpdate'
      responses:
        '204':
          description: No Content
      tags:
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    require(request.authz.can_bulk_import())
    job_id = get_session_id()
    entityset = request.args.get("entityset_id")
    if entityset is not None:
        entityset = get_entityset(entityset, request.authz.WRITE)

    # This will disable checksum security measures in order to allow bulk
    # loading of document data:
    safe = get_flag("safe", default=True)
    # Flag is only available for admins:
    if not request.authz.is_admin:
        safe = True

    # Let UI tools change the entities created by this:
    mutable = get_flag("mutable", default=False)
    entities = ensure_list(request.get_json(force=True))
    entity_ids = list()
    for entity_id in bulk_write(
        collection, entities, safe=safe, mutable=mutable, role_id=request.authz.id
    ):
        entity_ids.append(entity_id)
        if entityset is not None:
            save_entityset_item(
                entityset,
                collection,
                entity_id,
                added_by_id=request.authz.id,
            )
    collection.touch()
    db.session.commit()
    queue_task(collection, OP_INDEX, job_id=job_id, entity_ids=entity_ids)
    return ("", 204)


@blueprint.route("/<int:collection_id>/status", methods=["GET"])
def status(collection_id):
    """
    ---
    get:
      summary: Check processing status of a collection
      description: >
        Return the task queue status for the collection with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CollectionStatus'
      tags:
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.READ)
    request.rate_limit = None
    return jsonify(get_status(collection))


@blueprint.route("/<int:collection_id>/status", methods=["DELETE"])
def cancel(collection_id):
    """
    ---
    delete:
      summary: Cancel processing of a collection
      description: >
        Cancel all queued tasks for the collection with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CollectionStatus'
          description: OK
      tags:
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    cancel_queue(collection)
    refresh_collection(collection_id)
    return ("", 204)


@blueprint.route("/<int:collection_id>", methods=["DELETE"])
def delete(collection_id):
    """
    ---
    delete:
      summary: Delete a collection
      description: Delete the collection with id `collection_id`
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      - in: query
        description: Wait for delete to finish in backend.
        name: sync
        schema:
          type: boolean
      - in: query
        description: Delete only the contents, but not the collection itself.
        name: keep_metadata
        schema:
          type: boolean
      responses:
        '204':
          description: No Content
      tags:
        - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    keep_metadata = get_flag("keep_metadata", default=False)
    sync = get_flag("sync", default=True)
    delete_collection(collection, keep_metadata=keep_metadata, sync=sync)
    return ("", 204)
