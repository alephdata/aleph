import logging
from flask import Blueprint, request

from aleph.model import Diagram
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import DiagramSerializer
from aleph.views.util import get_db_collection, parse_request
from aleph.views.util import obj_or_404
from aleph.logic.diagram import create_diagram, update_diagram, delete_diagram


blueprint = Blueprint('diagrams_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/collections/<int:collection_id>/diagrams', methods=['GET'])  # noqa
def index(collection_id):
    """Returns a list of diagrams for the collection.
    ---
    get:
      summary: List diagrams
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
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
                      $ref: '#/components/schemas/Diagram'
          description: OK
      tags:
        - Collection
    """
    collection = get_db_collection(collection_id)
    parser = QueryParser(request.args, request.authz)
    q = Diagram.by_collection(collection.id)
    result = DatabaseQueryResult(request, q, parser=parser)
    return DiagramSerializer.jsonify_result(result)


@blueprint.route('/api/2/collections/<int:collection_id>/diagrams', methods=['POST', 'PUT'])  # noqa
def create(collection_id):
    """Create a diagram.
    ---
    post:
      summary: Create a diagram
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
              $ref: '#/components/schemas/DiagramCreate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Diagram'
          description: OK
      tags:
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    data = parse_request('DiagramCreate')
    diagram = create_diagram(data, collection, request.authz.id)
    return DiagramSerializer.jsonify(diagram)


@blueprint.route('/api/2/collections/<int:collection_id>/diagrams/<int:diagram_id>', methods=['GET'])  # noqa
def view(collection_id, diagram_id):
    """Return the diagram with id `diagram_id`.
    ---
    get:
      summary: Fetch a diagram
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      - description: The diagram id.
        in: path
        name: diagram_id
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
                $ref: '#/components/schemas/Diagram'
          description: OK
      tags:
      - Collection
    """
    get_db_collection(collection_id, request.authz.WRITE)
    diagram = obj_or_404(Diagram.by_id(diagram_id))
    return DiagramSerializer.jsonify(diagram)


@blueprint.route('/api/2/collections/<int:collection_id>/diagrams/<int:diagram_id>', methods=['POST', 'PUT'])  # noqa
def update(collection_id, diagram_id):
    """Update the diagram with id `diagram_id`.
    ---
    post:
      summary: Update a diagram
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      - description: The diagram id.
        in: path
        name: diagram_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DiagramCreate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Diagram'
          description: OK
      tags:
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    diagram = obj_or_404(Diagram.by_id(diagram_id))
    data = parse_request('DiagramCreate')
    diagram = update_diagram(diagram, data, collection)
    return DiagramSerializer.jsonify(diagram)


@blueprint.route('/api/2/collections/<int:collection_id>/diagrams/<int:diagram_id>', methods=['DELETE'])  # noqa
def delete(collection_id, diagram_id):
    """Delete a diagram.
    ---
    delete:
      summary: Delete a diagram
      parameters:
      - description: The collection id.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
        example: 2
      - description: The diagram id.
        in: path
        name: diagram_id
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
    diagram = obj_or_404(Diagram.by_id(diagram_id))
    delete_diagram(diagram)
    return ('', 204)
