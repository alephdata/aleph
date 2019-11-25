import logging
from banal import first
from followthemoney import model
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest

from aleph.core import db, archive
from aleph.model import Mapping
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.logic.collections import refresh_collection
from aleph.views.serializers import MappingSerializer
from aleph.views.util import (
    get_db_collection, parse_request, get_index_entity, get_session_id,
    require, obj_or_404
)
from aleph.queues import queue_task, OP_FLUSH_MAPPING, OP_REFRESH_MAPPING


blueprint = Blueprint('mappings_api', __name__)
log = logging.getLogger(__name__)


def load_query():
    try:
        query = request.json.get('mapping_query', '{}')
        # just for validation
        model.make_mapping({'entities': query})
    except Exception as ex:
        raise BadRequest(ex)
    return query


def get_mapping_query(mapping):
    table = get_index_entity(mapping.table_id, request.authz.READ)
    properties = table.get('properties', {})
    csv_hash = first(properties.get('csvHash'))
    query = {
        'entities': mapping.query,
        'proof': mapping.table_id,
    }
    if csv_hash:
        url = archive.generate_url(csv_hash)
        if not url:
            local_path = archive.load_file(csv_hash)
            if local_path is not None:
                url = local_path.as_posix()
        if url is not None:
            query['csv_url'] = url
            return {
                'query': query,
                'mapping_id': mapping.id,
            }
        raise BadRequest("Could not generate csv url for the table")
    raise BadRequest("Source table doesn't have a csvHash")


def flush_mapping(collection, mapping):
    job_id = get_session_id()
    payload = {
        'mapping_id': mapping.id,
    }
    queue_task(collection, OP_FLUSH_MAPPING, job_id=job_id, payload=payload)
    collection.touch()
    db.session.commit()
    refresh_collection(collection.id)


def load_mapping(collection, mapping):
    query = get_mapping_query(mapping)
    job_id = get_session_id()
    queue_task(collection, OP_REFRESH_MAPPING, job_id=job_id, payload=query)
    collection.touch()
    db.session.commit()
    refresh_collection(collection.id)


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
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    require(request.authz.can_bulk_import())
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    load_mapping(collection, mapping)
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
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    mapping = obj_or_404(Mapping.by_id(mapping_id))
    flush_mapping(collection, mapping)
    return ('', 202)
