from banal import ensure_list
from flask import Blueprint, request

from aleph.core import db, settings
from aleph.authz import Authz
from aleph.model import Collection
from aleph.search import CollectionsQuery
from aleph.queues import queue_task, get_status, cancel_queue
from aleph.queues import OP_REINGEST, OP_REINDEX
from aleph.index.collections import get_collection_stats
from aleph.logic.collections import create_collection, update_collection
from aleph.logic.collections import delete_collection, refresh_collection
from aleph.index.collections import update_collection_stats
from aleph.logic.processing import bulk_write
from aleph.logic.util import collection_url
from aleph.views.context import enable_cache
from aleph.views.serializers import CollectionSerializer
from aleph.views.util import get_db_collection, get_index_collection
from aleph.views.util import require, parse_request, jsonify
from aleph.views.util import render_xml, get_flag, get_session_id

blueprint = Blueprint("collections_api", __name__)


@blueprint.route("/api/2/collections", methods=["GET"])
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
                type: object
                allOf:
                - $ref: '#/components/schemas/QueryResponse'
                properties:
                  results:
                    type: array
                    items:
                      $ref: '#/components/schemas/Collection'
      tags:
      - Collection
    """
    result = CollectionsQuery.handle(request)
    return CollectionSerializer.jsonify_result(result)


@blueprint.route("/api/2/sitemap.xml")
def sitemap():
    """
    ---
    get:
      summary: Get a sitemap
      description: >-
        Returns a site map for search engine robots. This lists each
        published collection on the current instance.
      responses:
        '200':
          description: OK
          content:
            text/xml:
              schema:
                type: object
      tags:
      - System
    """
    enable_cache(vary_user=False)
    request.rate_limit = None
    collections = []
    for collection in Collection.all_authz(Authz.from_role(None)):
        updated_at = collection.updated_at.date().isoformat()
        updated_at = max(settings.SITEMAP_FLOOR, updated_at)
        url = collection_url(collection.id)
        collections.append({"url": url, "updated_at": updated_at})
    return render_xml("sitemap.xml", collections=collections)


@blueprint.route("/api/2/collections", methods=["POST", "PUT"])
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


@blueprint.route("/api/2/collections/<int:collection_id>", methods=["GET"])
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
                $ref: '#/components/schemas/CollectionFull'
      tags:
      - Collection
    """
    data = get_index_collection(collection_id)
    cobj = get_db_collection(collection_id)
    if get_flag("refresh", False):
        update_collection_stats(collection_id, ["schema"])
    data.update(
        {
            "statistics": get_collection_stats(cobj.id),
            "status": get_status(cobj),
            "shallow": False,
        }
    )
    return CollectionSerializer.jsonify(data)


@blueprint.route(
    "/api/2/collections/<int:collection_id>", methods=["POST", "PUT"]
)  # noqa
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


@blueprint.route(
    "/api/2/collections/<int:collection_id>/reingest", methods=["POST", "PUT"]
)  # noqa
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
    job_id = get_session_id()
    data = {"index": get_flag("index", False)}
    queue_task(collection, OP_REINGEST, job_id=job_id, payload=data)
    return ("", 202)


@blueprint.route(
    "/api/2/collections/<int:collection_id>/reindex", methods=["POST", "PUT"]
)  # noqa
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
    job_id = get_session_id()
    data = {"flush": get_flag("flush", False)}
    queue_task(collection, OP_REINDEX, job_id=job_id, payload=data)
    return ("", 202)


@blueprint.route("/api/2/collections/<int:collection_id>/_bulk", methods=["POST"])
@blueprint.route("/api/2/collections/<int:collection_id>/bulk", methods=["POST"])
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
    entities = ensure_list(request.get_json(force=True))

    # This will disable checksum security measures in order to allow bulk
    # loading of document data:
    safe = get_flag("safe", default=True)
    # Flag is only available for admins:
    if not request.authz.is_admin:
        safe = True

    # Let UI tools change the entities created by this:
    mutable = get_flag("mutable", default=False)
    role_id = request.authz.id
    bulk_write(collection, entities, safe=safe, mutable=mutable, role_id=role_id)
    collection.touch()
    db.session.commit()
    return ("", 204)


@blueprint.route("/api/2/collections/<int:collection_id>/status", methods=["GET"])
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


@blueprint.route(
    "/api/2/collections/<int:collection_id>/status", methods=["DELETE"]
)  # noqa
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


@blueprint.route("/api/2/collections/<int:collection_id>", methods=["DELETE"])
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
