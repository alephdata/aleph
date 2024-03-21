import logging
from banal import ensure_list
from flask import Blueprint, request
from prometheus_client import Counter

from aleph.index.entities import iter_entities, PROXY_INCLUDES
from aleph.views.util import require, stream_ijson

log = logging.getLogger(__name__)
blueprint = Blueprint("bulk_api", __name__)

STREAMED_ENTITIES = Counter(
    "aleph_streamed_entities_total",
    "Total number of streamed entities",
)

STREAMS = Counter(
    "aleph_streams_total",
    "Total number of entity streaming requests",
)


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
        require(request.authz.can(collection_id, request.authz.WRITE))
    else:
        require(request.authz.is_admin)
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

    STREAMS.inc()

    def generator(entities):
        for entity in entities:
            STREAMED_ENTITIES.inc()
            yield entity

    return stream_ijson(generator(entities))
