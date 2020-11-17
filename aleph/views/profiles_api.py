import logging
from flask import Blueprint, request
from followthemoney import model

from aleph.logic.profiles import get_profile
from aleph.logic.entities import entity_tags
from aleph.search import MatchQuery
from aleph.views.serializers import EntitySerializer, ProfileSerializer
from aleph.views.context import enable_cache, tag_request
from aleph.views.util import obj_or_404, jsonify

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
    enable_cache()
    profile = obj_or_404(get_profile(profile_id, authz=request.authz))
    tag_request(collection_id=profile.get("collection_id"))
    results = entity_tags(profile.get("merged"), request.authz)
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
    enable_cache()
    profile = obj_or_404(get_profile(profile_id, authz=request.authz))
    tag_request(collection_id=profile.get("collection_id"))
    entity = model.get_proxy(profile.get("merged"))
    exclude = [item["entity_id"] for item in profile["items"]]
    log.info("Exclude: %r", exclude)
    result = MatchQuery.handle(request, entity=entity, exclude=exclude)
    return EntitySerializer.jsonify_result(result)
