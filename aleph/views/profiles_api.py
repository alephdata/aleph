import logging
from flask import Blueprint, request
from followthemoney import model
from followthemoney.compare import compare

from aleph.settings import MAX_EXPAND_ENTITIES
from aleph.model import Judgement
from aleph.logic.profiles import get_profile, decide_pairwise
from aleph.logic.expand import entity_tags, expand_proxies
from aleph.queues import queue_task, OP_UPDATE_ENTITY
from aleph.search import MatchQuery, QueryParser
from aleph.views.serializers import ProfileSerializer, SimilarSerializer
from aleph.views.context import tag_request
from aleph.views.util import obj_or_404, jsonify, parse_request, get_session_id
from aleph.views.util import get_index_entity, get_db_collection
from aleph.views.util import require

blueprint = Blueprint("profiles_api", __name__)
log = logging.getLogger(__name__)


@blueprint.route("/api/2/profiles/<profile_id>", methods=["GET"])
def view(profile_id):
    """
    ---
    get:
      summary: Retrieve a profile
      description: >-
        Get a profile with constituent items and the merged pseudo entity.
      parameters:
      - in: path
        name: profile_id
        required: true
        schema:
          type: string
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Profile'
      tags:
      - Profile
    """
    profile = obj_or_404(get_profile(profile_id, authz=request.authz))
    require(request.authz.can(profile.get("collection_id"), request.authz.READ))
    return ProfileSerializer.jsonify(profile)


@blueprint.route("/api/2/profiles/<profile_id>/tags", methods=["GET"])
def tags(profile_id):
    """
    ---
    get:
      summary: Get profile tags
      description: >-
        Get tags for the profile with id `profile_id`.
      parameters:
      - in: path
        name: profile_id
        required: true
        schema:
          type: string
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
                      $ref: '#/components/schemas/EntityTag'
      tags:
      - Profile
    """
    profile = obj_or_404(get_profile(profile_id, authz=request.authz))
    require(request.authz.can(profile.get("collection_id"), request.authz.READ))
    tag_request(collection_id=profile.get("collection_id"))
    results = entity_tags(profile["merged"], request.authz)
    return jsonify({"status": "ok", "total": len(results), "results": results})


@blueprint.route("/api/2/profiles/<profile_id>/similar", methods=["GET"])
def similar(profile_id):
    """
    ---
    get:
      summary: Get similar entities
      description: >
        Get a list of similar entities to the profile with id `profile_id`
      parameters:
      - in: path
        name: profile_id
        required: true
        schema:
          type: string
      - in: query
        name: 'filter:schema'
        schema:
          items:
            type: string
          type: array
      - in: query
        name: 'filter:schemata'
        schema:
          items:
            type: string
          type: array
      responses:
        '200':
          description: Returns a list of entities
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitiesResponse'
      tags:
      - Profile
    """
    # enable_cache()
    profile = obj_or_404(get_profile(profile_id, authz=request.authz))
    require(request.authz.can(profile.get("collection_id"), request.authz.READ))
    tag_request(collection_id=profile.get("collection_id"))
    exclude = [item["entity_id"] for item in profile["items"]]
    result = MatchQuery.handle(request, entity=profile["merged"], exclude=exclude)
    entities = list(result.results)
    result.results = []
    for obj in entities:
        item = {
            "score": compare(model, profile["merged"], obj),
            "judgement": Judgement.NO_JUDGEMENT,
            "collection_id": profile.get("collection_id"),
            "entity": obj,
        }
        result.results.append(item)
    return SimilarSerializer.jsonify_result(result)


@blueprint.route("/api/2/profiles/<profile_id>/expand", methods=["GET"])
def expand(profile_id):
    """
    ---
    get:
      summary: Expand the profile to get its adjacent entities
      description: >-
        Get the property-wise list of entities adjacent to the entities that
        are part of the profile `profile_id`.
      parameters:
      - in: path
        name: profile_id
        required: true
        schema:
          type: string
      - description: properties to filter on
        in: query
        name: 'filter:property'
        schema:
          type: string
      - in: query
        description: number of entities to return per property
        name: limit
        schema:
          type: number
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
                      $ref: '#/components/schemas/EntityExpand'
      tags:
      - Profile
    """
    profile = obj_or_404(get_profile(profile_id, authz=request.authz))
    require(request.authz.can(profile.get("collection_id"), request.authz.READ))
    tag_request(collection_id=profile.get("collection_id"))
    parser = QueryParser(request.args, request.authz, max_limit=MAX_EXPAND_ENTITIES)
    properties = parser.filters.get("property")
    results = expand_proxies(
        profile.get("proxies"),
        properties=properties,
        authz=request.authz,
        limit=parser.limit,
    )
    result = {
        "status": "ok",
        "total": sum(result["count"] for result in results),
        "results": results,
    }
    return jsonify(result)


@blueprint.route("/api/2/profiles/_pairwise", methods=["POST"])
def pairwise():
    """
    ---
    post:
      summary: Make a pairwise judgement between an entity and a match.
      description: >
        This lets a user decide if they think a given xref match is a true or
        false match. Implicitly, this might create or alter a profile in the
        collection used by
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Pairwise'
      responses:
        '200':
          content:
            application/json:
              schema:
                properties:
                  status:
                    description: accepted
                    type: string
                  profile_id:
                    description: profile_id for `entity`.
                    type: string
                type: object
          description: Accepted
      tags:
      - Profile
    """
    data = parse_request("Pairwise")
    entity = get_index_entity(data.get("entity_id"))
    collection = get_db_collection(entity["collection_id"], request.authz.WRITE)
    match = get_index_entity(data.get("match_id"))
    match_collection = get_db_collection(match["collection_id"])
    profile = decide_pairwise(
        collection,
        entity,
        match_collection,
        match,
        judgement=data.get("judgement"),
        authz=request.authz,
    )
    job_id = get_session_id()
    queue_task(collection, OP_UPDATE_ENTITY, job_id=job_id, entity_id=entity.get("id"))
    profile_id = profile.id if profile is not None else None
    return jsonify({"status": "ok", "profile_id": profile_id}, status=200)
