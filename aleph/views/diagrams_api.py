import logging
from banal import ensure_list
from flask import Blueprint, request

from aleph.core import db
from aleph.model import Diagram
from aleph.logic.entities import upsert_entity
from aleph.logic.diagrams import replace_layout_ids
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.serializers import DiagramSerializer
from aleph.views.util import get_nested_collection, get_db_collection
from aleph.views.util import obj_or_404, parse_request


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
    parser = QueryParser(request.args, request.authz)
    q = Diagram.by_authz(request.authz)
    collection_ids = ensure_list(parser.filters.get('collection_id'))
    if len(collection_ids):
        q = q.filter(Diagram.collection_id.in_(collection_ids))
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
    collection = get_nested_collection(data, request.authz.WRITE)
    old_to_new_id_map = {}
    entity_ids = []
    for entity in data.pop('entities', []):
        old_id = entity.get('id')
        new_id = upsert_entity(entity, collection, sync=True)
        old_to_new_id_map[old_id] = new_id
        entity_ids.append(new_id)
    data['entities'] = entity_ids
    layout = data.get('layout', {})
    data['layout'] = replace_layout_ids(layout, old_to_new_id_map)
    diagram = Diagram.create(data, collection, request.authz.id)
    db.session.commit()
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
              $ref: '#/components/schemas/DiagramUpdate'
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
    diagram.update(data, collection)
    collection.touch()
    db.session.commit()
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
    collection = get_db_collection(diagram.collection_id, request.authz.WRITE)
    diagram.delete()
    collection.touch()
    db.session.commit()
    return ('', 204)
