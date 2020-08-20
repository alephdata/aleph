import logging
from flask import Blueprint, request
from followthemoney import model

from aleph.search import XrefQuery
from aleph.index.xref import get_xref
from aleph.logic.profiles import decide_xref, pairwise_decisions
from aleph.views.serializers import XrefSerializer
from aleph.queues import (
    queue_task,
    sla_dataset_from_role,
    OP_XREF,
    OP_EXPORT_XREF_RESULTS,
)
from aleph.views.util import (
    get_db_collection,
    get_index_collection,
    get_index_entity,
    get_session_id,
    parse_request,
    require,
    jsonify,
    obj_or_404,
)

blueprint = Blueprint("xref_api", __name__)
log = logging.getLogger(__name__)


@blueprint.route("/api/2/collections/<int:collection_id>/xref", methods=["GET"])  # noqa
def index(collection_id):
    """
    ---
    get:
      summary: Fetch cross-reference results
      description: >-
        Fetch cross-reference matches for entities in the collection
        with id `collection_id`
      parameters:
      - in: path
        name: collection_id
        required: true
        schema:
          type: integer
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
                      $ref: '#/components/schemas/XrefResponse'
      tags:
      - Xref
      - Collection
    """
    get_index_collection(collection_id)
    result = XrefQuery.handle(request, collection_id=collection_id)
    require(request.authz.can(collection_id, request.authz.READ))
    pairs = []
    for xref in result.results:
        pairs.append((xref.get("entity_id"), xref.get("match_id")))
    decisions = pairwise_decisions(pairs, collection_id)
    for xref in result.results:
        key = (xref.get("entity_id"), xref.get("match_id"))
        xref["decision"] = decisions.get(key)
    return XrefSerializer.jsonify_result(result)


@blueprint.route(
    "/api/2/collections/<int:collection_id>/xref", methods=["POST"]
)  # noqa
def generate(collection_id):
    """
    ---
    post:
      summary: Generate cross-reference matches
      description: >
        Generate cross-reference matches for entities in a collection.
      parameters:
      - in: path
        name: collection_id
        required: true
        schema:
          type: integer
      responses:
        '202':
          content:
            application/json:
              schema:
                properties:
                  status:
                    description: accepted
                    type: string
                type: object
          description: Accepted
      tags:
      - Xref
      - Collection
    """
    collection = get_db_collection(collection_id, request.authz.WRITE)
    queue_task(collection, OP_XREF)
    return jsonify({"status": "accepted"}, status=202)


@blueprint.route("/api/2/collections/<int:collection_id>/xref.xlsx")
def export(collection_id):
    """
    ---
    get:
      summary: Download cross-reference results
      description: Download results of cross-referencing as an Excel file
      parameters:
      - in: path
        name: collection_id
        required: true
        schema:
          type: integer
      responses:
        '202':
          description: Accepted
      tags:
      - Xref
      - Collection
    """
    get_db_collection(collection_id, request.authz.READ)
    job_id = get_session_id()
    payload = {"role_id": request.authz.id, "collection_id": collection_id}
    dataset = sla_dataset_from_role(request.authz.id)
    queue_task(dataset, OP_EXPORT_XREF_RESULTS, job_id=job_id, payload=payload)
    return ("", 202)


@blueprint.route(
    "/api/2/collections/<int:collection_id>/xref/<xref_id>", methods=["POST"]
)
def decide(collection_id, xref_id):
    """
    ---
    post:
      summary: Give feedback about the veracity of an xref match.
      description: >
        This lets a user decide if they think a given xref match is a true or
        false match, and what group of users (context) should be privy to this
        insight.
      parameters:
      - in: path
        name: collection_id
        required: true
        schema:
          type: integer
      - in: path
        name: xref_id
        required: true
        schema:
          type: string
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/XrefDecide'
      responses:
        '202':
          content:
            application/json:
              schema:
                properties:
                  status:
                    description: accepted
                    type: string
                type: object
          description: Accepted
      tags:
      - Xref
      - Profiles
      - EntitySet
    """
    data = parse_request("XrefDecide")
    xref = obj_or_404(get_xref(xref_id, collection_id=collection_id))
    require(request.authz.can(collection_id, request.authz.WRITE))

    entity = get_index_entity(xref.get("entity_id"))
    match = get_index_entity(xref.get("match_id"))
    if entity is None and match is None:
        # This will raise a InvalidData error if the two types are not compatible
        model.common_schema(entity.get("schema"), match.get("schema"))

    decide_xref(xref, judgement=data.get("decision"), authz=request.authz)
    return jsonify({"status": "ok"}, status=204)
