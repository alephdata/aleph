import logging
from banal import first
from flask import Blueprint, request

from aleph.model import Diagram
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import DiagramSerializer
from aleph.views.util import get_db_collection, parse_request
from aleph.views.util import obj_or_404, require
from aleph.logic.diagram import create_diagram, update_diagram, delete_diagram


blueprint = Blueprint('diagrams_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/diagrams', methods=['GET'])
def index():
    """Returns a list of diagrams for the role
    ---
    get:
      summary: List diagrams
      parameters:
      - description: The collection id.
        in: query
        name: 'filter:collection_id'
        required: true
        schema:
          minimum: 1
          type: integer
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
        - Diagram
    """
    require(request.authz.logged_in)
    parser = QueryParser(request.args, request.authz)
    collection_id = first(parser.filters.get('collection_id'))
    if collection_id:
        get_db_collection(collection_id)
        q = Diagram.by_collection(collection_id).filter(Diagram.role_id == request.authz.id)  # noqa
    else:
        q = Diagram.by_role_id(request.authz.id)
    result = DatabaseQueryResult(request, q)
    return DiagramSerializer.jsonify_result(result)


@blueprint.route('/api/2/diagrams', methods=['POST', 'PUT'])
def create():
    """Create a diagram.
    ---
    post:
      summary: Create a diagram
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
      - Diagram
    """
    data = parse_request('DiagramCreate')
    collection_id = data.pop('collection_id')
    collection = get_db_collection(collection_id, request.authz.WRITE)
    diagram = create_diagram(data, collection, request.authz.id)
    return DiagramSerializer.jsonify(diagram)


@blueprint.route('/api/2/diagrams/<int:diagram_id>', methods=['GET'])
def view(diagram_id):
    """Return the diagram with id `diagram_id`.
    ---
    get:
      summary: Fetch a diagram
      parameters:
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
      - Diagram
    """
    diagram = obj_or_404(Diagram.by_id(diagram_id))
    get_db_collection(diagram.collection_id, request.authz.READ)
    return DiagramSerializer.jsonify(diagram)


@blueprint.route('/api/2/diagrams/<int:diagram_id>', methods=['POST', 'PUT'])
def update(diagram_id):
    """Update the diagram with id `diagram_id`.
    ---
    post:
      summary: Update a diagram
      parameters:
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
      - Diagram
    """
    diagram = obj_or_404(Diagram.by_id(diagram_id))
    collection = get_db_collection(diagram.collection_id, request.authz.WRITE)
    data = parse_request('DiagramUpdate')
    diagram = update_diagram(diagram, data, collection)
    return DiagramSerializer.jsonify(diagram)


@blueprint.route('/api/2/diagrams/<int:diagram_id>', methods=['DELETE'])
def delete(diagram_id):
    """Delete a diagram.
    ---
    delete:
      summary: Delete a diagram
      parameters:
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
      - Diagram
    """
    diagram = obj_or_404(Diagram.by_id(diagram_id))
    get_db_collection(diagram.collection_id, request.authz.WRITE)
    delete_diagram(diagram)
    return ('', 204)
