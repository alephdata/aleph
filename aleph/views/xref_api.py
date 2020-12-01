import logging
from flask import Blueprint, request
from pantomime.types import XLSX

from aleph.search import XrefQuery
from aleph.logic.profiles import pairwise_judgements
from aleph.logic.export import create_export
from aleph.views.serializers import XrefSerializer
from aleph.queues import queue_task, OP_XREF, OP_EXPORT_XREF
from aleph.views.util import (
    get_db_collection,
    get_index_collection,
    get_session_id,
    jsonify,
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
    get_index_collection(collection_id, request.authz.READ)
    result = XrefQuery.handle(request, collection_id=collection_id)
    pairs = []
    for xref in result.results:
        pairs.append((xref.get("entity_id"), xref.get("match_id")))
    judgements = pairwise_judgements(pairs, collection_id)
    for xref in result.results:
        key = (xref.get("entity_id"), xref.get("match_id"))
        xref["judgement"] = judgements.get(key)
    return XrefSerializer.jsonify_result(result)


@blueprint.route("/api/2/collections/<int:collection_id>/xref", methods=["POST"])
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


@blueprint.route("/api/2/collections/<int:collection_id>/xref.xlsx", methods=["POST"])
def export(collection_id):
    """
    ---
    post:
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
    collection = get_db_collection(collection_id, request.authz.READ)
    label = "%s - Crossreference results" % collection.label
    export = create_export(
        operation=OP_EXPORT_XREF,
        role_id=request.authz.id,
        label=label,
        collection=collection,
        mime_type=XLSX,
    )
    job_id = get_session_id()
    queue_task(None, OP_EXPORT_XREF, job_id=job_id, export_id=export.id)
    return ("", 202)
