import logging
from banal import first
from followthemoney import model
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest

from aleph.core import db
from aleph.model import Mapping
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.queues import queue_task, OP_FLUSH_MAPPING, OP_LOAD_MAPPING
from aleph.views.serializers import MappingSerializer
from aleph.views.util import get_db_collection, parse_request
from aleph.views.util import get_index_entity, get_session_id, obj_or_404


blueprint = Blueprint('mappings_api', __name__)
log = logging.getLogger(__name__)


def load_query():
    try:
        query = request.json.get('mapping_query', {})
        # just for validation
        model.make_mapping({'entities': query})
    except Exception as ex:
        log.exception("Validation error: %s", request.json)
        raise BadRequest(str(ex))
    return query


@blueprint.route('/api/2/collections/<int:collection_id>/mappings', methods=['GET'])  # noqa
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
      requestBody:
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
    collection = get_db_collection(collection_id)
    parser = QueryParser(request.args, request.authz)
    table_id = first(parser.filters.get('table'))
    q = Mapping.by_collection(collection.id, table_id=table_id)
    result = DatabaseQueryResult(request, q, parser=parser)
    return MappingSerializer.jsonify_result(result)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings', methods=['POST', 'PUT'])  # noqa
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
    data = parse_request('MappingCreate')
    entity_id = data.get('table_id')
    query = load_query()
    entity = get_index_entity(entity_id, request.authz.READ)
    mapping = Mapping.create(query, entity.get('id'), collection, request.authz.id)  # noqa
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>', methods=['GET'])  # noqa
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


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>', methods=['POST', 'PUT'])  # noqa
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
    data = parse_request('MappingCreate')
    entity_id = data.get('table_id')
    query = load_query()
    entity = get_index_entity(entity_id, request.authz.READ)
    mapping.update(query=query, table_id=entity.get('id'))
    return MappingSerializer.jsonify(mapping)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>', methods=['DELETE'])  # noqa
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
    get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    mapping.delete()
    return ('', 204)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>/trigger',  # noqa
                 methods=['POST', 'PUT'])
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
    db.session.commit()
    job_id = get_session_id()
    payload = {'mapping_id': mapping.id}
    queue_task(collection, OP_LOAD_MAPPING, job_id=job_id, payload=payload)
    return ('', 202)


@blueprint.route('/api/2/collections/<int:collection_id>/mappings/<int:mapping_id>/flush',  # noqa
                 methods=['POST', 'PUT'])
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
    db.session.commit()
    queue_task(collection, OP_FLUSH_MAPPING,
               job_id=get_session_id(),
               payload={'mapping_id': mapping.id})
    return ('', 202)
