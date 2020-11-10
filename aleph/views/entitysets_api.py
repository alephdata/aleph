import logging
from banal import ensure_list
from flask import Blueprint, request
from werkzeug.exceptions import NotFound

from aleph.core import db
from aleph.model import EntitySet, EntitySetItem
from aleph.model.common import make_textid
from aleph.logic.entitysets import create_entityset
from aleph.logic.entities import upsert_entity, validate_entity, check_write_entity
from aleph.search import EntitySetItemsQuery, SearchQueryParser
from aleph.search import QueryParser, DatabaseQueryResult
from aleph.views.context import tag_request
from aleph.views.entities_api import view as entity_view
from aleph.views.serializers import EntitySerializer, EntitySetSerializer
from aleph.views.serializers import EntitySetItemSerializer
from aleph.views.serializers import EntitySetIndexSerializer
from aleph.views.util import get_nested_collection, get_index_entity, get_entityset
from aleph.views.util import parse_request, get_db_collection, get_flag


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
      - description: The type of the entity set
        in: query
        name: 'filter:type'
        required: false
      - description: Quert string for searches
        in: query
        name: 'prefix'
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
    types = parser.filters.get("type")
    q = EntitySet.by_authz(request.authz, types=types, prefix=parser.prefix)
    collection_ids = ensure_list(parser.filters.get("collection_id"))
    if len(collection_ids):
        q = q.filter(EntitySet.collection_id.in_(collection_ids))
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
          type: string
        example: 3a0d91ece2dce88ad3259594c7b642485235a048
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
    entityset = get_entityset(entityset_id, request.authz.READ)
    return EntitySetSerializer.jsonify(entityset)


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
    entityset = get_entityset(entityset_id, request.authz.WRITE)
    data = parse_request("EntitySetUpdate")
    entityset.update(data)
    db.session.commit()
    return EntitySetSerializer.jsonify(entityset)


@blueprint.route("/api/2/entitysets/<entityset_id>", methods=["DELETE"])
def delete(entityset_id):
    """Delete an entity set.
    ---
    delete:
      summary: Delete an entity set
      parameters:
      - description: The entity set ID.
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
    entityset = get_entityset(entityset_id, request.authz.WRITE)
    entityset.delete()
    db.session.commit()
    return ("", 204)


@blueprint.route("/api/2/entitysets/<entityset_id>/entities", methods=["GET"])
def entities_index(entityset_id):
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
    entityset = get_entityset(entityset_id, request.authz.READ)
    parser = SearchQueryParser(request.args, request.authz)
    tag_request(query=parser.text, prefix=parser.prefix)
    result = EntitySetItemsQuery.handle(request, parser=parser, entityset=entityset)
    return EntitySerializer.jsonify_result(result)


@blueprint.route("/api/2/entitysets/<entityset_id>/entities", methods=["POST", "PUT"])
def entities_update(entityset_id):
    """
    ---
    post:
      summary: Update an entity and add it to the entity set.
      description: >
        Update the entity with id `entity_id`. If it does not exist it will be
        created. If the user cannot edit the given entity, it is merely added
        to the entity set. New entities are always created in the collection of
        the entity set.

        Aside from these idiosyncracies, this is the same as `/api/2/entities/<id>`,
        but handles entity set membership transparently.
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
              $ref: '#/components/schemas/EntityUpdate'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Entity'
      tags:
      - Entity
    """
    entityset = get_entityset(entityset_id, request.authz.WRITE)
    data = parse_request("EntityUpdate")
    entity_id = data.get("id", make_textid())
    try:
        entity = get_index_entity(entity_id, request.authz.READ)
        collection = get_db_collection(entity.get("collection_id"), request.authz.READ)
    except NotFound:
        entity = None
        collection = entityset.collection
    tag_request(collection_id=entityset.collection_id)
    if entity is None or check_write_entity(entity, request.authz):
        if get_flag("validate", default=False):
            validate_entity(data)
        sync = get_flag("sync", default=True)
        entity_id = upsert_entity(data, collection, authz=request.authz, sync=sync)
    EntitySetItem.save(
        entityset,
        entity_id,
        collection_id=collection.id,
        added_by_id=request.authz.id,
    )
    db.session.commit()
    return entity_view(entity_id)


@blueprint.route("/api/2/entitysets/<entityset_id>/items", methods=["GET"])
def item_index(entityset_id):
    """See a list of all items in that are linked to this entity set.

    This gives entities that are judged negative and unsure alongside the
    positive matches returned by the subling `./entities` API.
    ---
    post:
      summary: Get all items in the entity set.
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
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitySetItemResponse'
          description: OK
      tags:
      - EntitySetItem
    """
    entityset = get_entityset(entityset_id, request.authz.READ)
    result = DatabaseQueryResult(request, entityset.items(request.authz))
    return EntitySetItemSerializer.jsonify_result(result)


@blueprint.route("/api/2/entitysets/<entityset_id>/items", methods=["POST", "PUT"])
def item_update(entityset_id):
    """Add an item to the entity set with id `entityset_id`, or change
    the items judgement.

    To delete an item from the entity set, apply the judgement: `no_judgement`.
    ---
    post:
      summary: Add item to an entityset
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
              $ref: '#/components/schemas/EntitySetItemUpdate'
      responses:
        '200':
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitySetItem'
          description: OK
        '204':
          description: Item removed
      tags:
      - EntitySetItem
    """
    entityset = get_entityset(entityset_id, request.authz.WRITE)
    data = parse_request("EntitySetItemUpdate")
    entity = data.pop("entity", {})
    entity_id = data.pop("entity_id", entity.get("id"))
    entity = get_index_entity(entity_id, request.authz.READ)
    data["collection_id"] = entity["collection_id"]
    data["added_by_id"] = request.authz.id
    item = EntitySetItem.save(entityset, entity_id, **data)
    db.session.commit()
    if item is None:
        return ("", 204)
    return EntitySetItemSerializer.jsonify(item)
