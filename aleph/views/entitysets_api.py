import logging
from banal import ensure_list
from flask import Blueprint, request

from aleph.core import db
from aleph.model import EntitySet
from aleph.logic.entitysets import create_entityset
from aleph.search import EntitySetItemsQuery, SearchQueryParser
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.context import tag_request
from aleph.views.serializers import EntitySerializer, EntitySetSerializer
from aleph.views.serializers import EntitySetIndexSerializer
from aleph.views.util import get_nested_collection, get_db_collection
from aleph.views.util import obj_or_404, parse_request


blueprint = Blueprint("entitysets_api", __name__)
log = logging.getLogger(__name__)


@blueprint.route("/api/2/entitysets", methods=["GET"])
def index():
    """Returns a list of entitysets for the role
    ---
    get:
      summary: List entitysets
      parameters:
      - description: The collection id.
        in: query
        name: 'filter:collection_id'
        required: true
        schema:
          minimum: 1
          type: integer
      - type: The type of the entitiyset
        in: query
        name: 'filter:type'
        required: false
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
                      $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
        - EntitySet
    """
    parser = QueryParser(request.args, request.authz)
    q = EntitySet.by_authz(request.authz)
    collection_ids = ensure_list(parser.filters.get("collection_id"))
    if len(collection_ids):
        q = q.filter(EntitySet.collection_id.in_(collection_ids))
    types = ensure_list(parser.filters.get("type"))
    if len(types):
        q = q.filter(EntitySet.type.in_(types))
    result = DatabaseQueryResult(request, q, parser=parser)
    return EntitySetIndexSerializer.jsonify_result(result)


@blueprint.route("/api/2/entitysets", methods=["POST", "PUT"])
def create():
    """Create an entityset.
    ---
    post:
      summary: Create an entityset
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EntitySetCreate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
      - EntitySet
    """
    data = parse_request("EntitySetCreate")
    collection = get_nested_collection(data, request.authz.WRITE)
    entityset = create_entityset(collection, data, request.authz)
    db.session.commit()
    return EntitySetSerializer.jsonify(entityset)


@blueprint.route("/api/2/entitysets/<entityset_id>", methods=["GET"])
def view(entityset_id):
    """Return the entityset with id `entityset_id`.
    ---
    get:
      summary: Fetch an entityset
      parameters:
      - description: The entityset id.
        in: path
        name: entityset_id
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
                $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
      - EntitySet
    """
    entityset = obj_or_404(EntitySet.by_id(entityset_id))
    get_db_collection(entityset.collection_id, request.authz.READ)
    return EntitySetSerializer.jsonify(entityset)


@blueprint.route("/api/2/entitysets/<entityset_id>/entities", methods=["GET"])
def entities(entityset_id):
    """Search entities in the entity set with id `entityset_id`.
    ---
    get:
      summary: Search entities in the entity set with id `entityset_id`
      description: >
        Supports all query filters and arguments present in the normal
        entity search API, but all resulting entities will be members of
        the set.
      parameters:
      - description: The entityset id.
        in: path
        name: entityset_id
        required: true
        schema:
          type: string
        example: 3a0d91ece2dce88ad3259594c7b642485235a048
      responses:
        '200':
          description: Resturns a list of entities in result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitiesResponse'
      tags:
      - EntitySet
    """
    entityset = obj_or_404(EntitySet.by_id(entityset_id))
    get_db_collection(entityset.collection_id, request.authz.READ)
    parser = SearchQueryParser(request.args, request.authz)
    tag_request(query=parser.text, prefix=parser.prefix)
    result = EntitySetItemsQuery.handle(request, parser=parser, entityset=entityset)
    return EntitySerializer.jsonify_result(result)


@blueprint.route("/api/2/entitysets/<entityset_id>", methods=["POST", "PUT"])
def update(entityset_id):
    """Update the entityset with id `entityset_id`.
    ---
    post:
      summary: Update an entityset
      parameters:
      - description: The entityset id.
        in: path
        name: entityset_id
        required: true
        schema:
          type: string
        example: 3a0d91ece2dce88ad3259594c7b642485235a048
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EntitySetUpdate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
      - EntitySet
    """
    eset = obj_or_404(EntitySet.by_id(entityset_id))
    collection = get_db_collection(eset.collection_id, request.authz.WRITE)
    data = parse_request("EntitySetUpdate")
    eset.update(data, collection)
    db.session.commit()
    return EntitySetSerializer.jsonify(eset)


@blueprint.route("/api/2/entitysets/<entityset_id>", methods=["DELETE"])
def delete(entityset_id):
    """Delete an entityset.
    ---
    delete:
      summary: Delete an entityset
      parameters:
      - description: The entityset id.
        in: path
        name: entityset_id
        required: true
        schema:
          type: string
        example: 3a0d91ece2dce88ad3259594c7b642485235a048
      responses:
        '204':
          description: No Content
      tags:
      - EntitySet
    """
    eset = obj_or_404(EntitySet.by_id(entityset_id))
    collection = get_db_collection(eset.collection_id, request.authz.WRITE)
    eset.delete()
    collection.touch()
    db.session.commit()
    return ("", 204)
