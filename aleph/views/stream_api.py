import logging
from banal import ensure_list
from flask import Blueprint, request, abort
from flask.wrappers import Response

from aleph.index.entities import iter_entities, PROXY_INCLUDES
from aleph.util import JSONEncoder

log = logging.getLogger(__name__)
blueprint = Blueprint("bulk_api", __name__)


def stream_ijson(iterable, encoder=JSONEncoder):
    """Stream JSON line-based data."""

    def _generate_stream():
        for row in iterable:
            row.pop("_index", None)
            yield encoder().encode(row)
            yield "\n"

    return Response(_generate_stream(), mimetype="application/json+stream")


@blueprint.route("/api/2/entities/_stream")
@blueprint.route("/api/2/collections/<int:collection_id>/_stream")
def entities(collection_id=None):
    """
    ---
    get:
      summary: Stream collection entities.
      description: >
        Stream a JSON form of each entity in the given collection, or
        throughout the entire database.
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      responses:
        '200':
          description: OK
          content:
            application/x-ndjson:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Entity'
      tags:
      - Entity
    """
    if collection_id is not None:
        if not request.authz.can(collection_id, request.authz.WRITE):
            abort(403)
    else:
        if not request.authz.is_admin:
            abort(403)
    schemata = ensure_list(request.args.getlist("schema"))
    includes = ensure_list(request.args.getlist("include"))
    includes = includes or PROXY_INCLUDES
    log.debug("Stream entities [%r] begins... (coll: %s)", request.authz, collection_id)
    entities = iter_entities(
        authz=request.authz,
        collection_id=collection_id,
        schemata=schemata,
        includes=includes,
    )
    return stream_ijson(entities)
