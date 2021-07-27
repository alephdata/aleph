import logging
from banal import first
from followthemoney import model
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest

from aleph.core import db
from aleph.model import Mapping, Status
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.queues import queue_task, OP_FLUSH_MAPPING, OP_LOAD_MAPPING
from aleph.views.serializers import MappingSerializer
from aleph.views.util import get_db_collection, get_entityset, parse_request, get_nested
from aleph.views.util import get_index_entity, get_session_id, obj_or_404, require


blueprint = Blueprint("mappings_api", __name__)
log = logging.getLogger(__name__)


def load_query():
    try:
        query = request.json.get("mapping_query", {})
        # just for validation
        model.make_mapping({"entities": query})
    except Exception as ex:
        log.exception("Validation error: %s", request.json)
        raise BadRequest(str(ex))
    return query


def get_table_id(data):
    return get_index_entity(data.get("table_id"), request.authz.READ).get("id")


def get_entityset_id(data):
    entityset_id = get_nested(data, "entityset", "entityset_id")
    if entityset_id is not None:
        get_entityset(entityset_id, request.authz.WRITE)
        return entityset_id


@blueprint.route("/<int:collection_id>/mappings", methods=["GET"])
def index(collection_id):
    """Returns a list of mappings for the collection and table.
    ---
    get:
      summary: List mappings
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      - description: The table id.
        in: query
        name: table
        schema:
          type: string
      responses:
        '200':
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
                      $ref: '#/components/schemas/Mapping'
          description: OK
      tags:
        - Collection
        - Mapping
    """
    require(request.authz.can_browse_anonymous)
    collection = get_db_collection(collection_id)
    parser = QueryParser(request.args, request.authz)
    table_id = first(parser.filters.get("table"))
    q = Mapping.by_collection(collection.id, table_id=table_id)
    result = DatabaseQueryResult(request, q, parser=parser)
    return MappingSerializer.jsonify_result(result)


@blueprint.route("/<int:collection_id>/mappings", methods=["POST", "PUT"])
def create(collection_id):
    """Create a mapping.
    ---
    post:
      summary: Create a mapping
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MappingCreate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Mapping'
          description: OK
      tags:
      - Collection
      - Mapping
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    data = parse_request("MappingCreate")
    mapping = Mapping.create(
        load_query(),
        get_table_id(data),
        collection,
        request.authz.id,
        entityset_id=get_entityset_id(data),
    )
    db.session.commit()
    return MappingSerializer.jsonify(mapping)


@blueprint.route("/<int:collection_id>/mappings/<int:mapping_id>", methods=["GET"])
def view(collection_id, mapping_id):
    """Return the mapping with id `mapping_id`.
    ---
    get:
      summary: Fetch a mapping
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      - description: The mapping id.
        in: path
        name: mapping_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Mapping'
          description: OK
      tags:
      - Collection
      - Mapping
    """
    get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    return MappingSerializer.jsonify(mapping)


@blueprint.route(
    "/<int:collection_id>/mappings/<int:mapping_id>",
    methods=["POST", "PUT"],
)
def update(collection_id, mapping_id):
    """Update the mapping with id `mapping_id`.
    ---
    post:
      summary: Update a mapping
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      - description: The mapping id.
        in: path
        name: mapping_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/MappingCreate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Mapping'
          description: OK
      tags:
      - Collection
      - Mapping
    """
    get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    data = parse_request("MappingCreate")
    mapping.update(
        query=load_query(),
        table_id=get_table_id(data),
        entityset_id=get_entityset_id(data),
    )
    db.session.commit()
    return MappingSerializer.jsonify(mapping)


@blueprint.route(
    "/<int:collection_id>/mappings/<int:mapping_id>/trigger",
    methods=["POST", "PUT"],
)
def trigger(collection_id, mapping_id):
    """Load entities by running the mapping with id `mapping_id`. Flushes
    previously loaded entities before loading new entities.
    ---
    post:
      summary: Load entities from a mapping
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      - description: The mapping id.
        in: path
        name: mapping_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      responses:
        '202':
          description: No Content
      tags:
      - Collection
      - Mapping
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    mapping.disabled = False
    mapping.set_status(Status.PENDING)
    db.session.commit()
    job_id = get_session_id()
    queue_task(collection, OP_LOAD_MAPPING, job_id=job_id, mapping_id=mapping.id)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    return MappingSerializer.jsonify(mapping, status=202)


@blueprint.route(
    "/<int:collection_id>/mappings/<int:mapping_id>/flush",
    methods=["POST", "PUT"],
)
def flush(collection_id, mapping_id):
    """Flush all entities loaded by mapping with id `mapping_id`.
    ---
    post:
      summary: Flush entities loaded by a mapping
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      - description: The mapping id.
        in: path
        name: mapping_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      responses:
        '202':
          description: No Content
      tags:
      - Collection
      - Mapping
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    mapping.disabled = True
    mapping.last_run_status = None
    mapping.last_run_err_msg = None
    db.session.add(mapping)
    db.session.commit()
    queue_task(
        collection,
        OP_FLUSH_MAPPING,
        job_id=get_session_id(),
        mapping_id=mapping_id,
    )
    return ("", 202)


@blueprint.route(
    "/<int:collection_id>/mappings/<int:mapping_id>",
    methods=["DELETE"],
)
def delete(collection_id, mapping_id):
    """Delete a mapping.
    ---
    delete:
      summary: Delete a mapping
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      - description: The mapping id.
        in: path
        name: mapping_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      responses:
        '204':
          description: No Content
      tags:
      - Collection
      - Mapping
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    mapping.delete()
    db.session.commit()
    queue_task(
        collection,
        OP_FLUSH_MAPPING,
        job_id=get_session_id(),
        mapping_id=mapping_id,
    )
    return ("", 204)
