import logging
from flask import Blueprint, request
from flask_babel import gettext
from werkzeug.exceptions import NotFound
from followthemoney import model
from followthemoney.compare import compare
from pantomime.types import ZIP

from aleph.core import db, url_for
from aleph.search import EntitiesQuery, MatchQuery, DatabaseQueryResult
from aleph.search.parser import SearchQueryParser, QueryParser
from aleph.logic.entities import upsert_entity, delete_entity
from aleph.logic.entities import validate_entity, check_write_entity
from aleph.logic.profiles import pairwise_judgements
from aleph.logic.expand import entity_tags, expand_proxies
from aleph.logic.html import sanitize_html
from aleph.logic.export import create_export
from aleph.model.entityset import EntitySet, Judgement
from aleph.index.util import MAX_PAGE
from aleph.views.util import get_index_entity, get_db_collection
from aleph.views.util import jsonify, parse_request, get_flag
from aleph.views.util import require, get_nested_collection, get_session_id
from aleph.views.context import enable_cache, tag_request
from aleph.views.serializers import EntitySerializer, EntitySetSerializer
from aleph.views.serializers import SimilarSerializer
from aleph.settings import MAX_EXPAND_ENTITIES
from aleph.queues import queue_task, OP_EXPORT_SEARCH

log = logging.getLogger(__name__)
blueprint = Blueprint("entities_api", __name__)


@blueprint.route("/api/2/search", methods=["GET", "POST", "PUT"])
@blueprint.route("/api/2/entities", methods=["GET"])
def index():
    """
    ---
    get:
      summary: Search entities
      description: >
        Returns a list of entities matching the given search criteria.

        A filter can be applied to show only results from a particular
        collection: `?filter:collection_id={collection_id}`.

        If you know you only want to search documents (unstructured, ingested
        data) or entities (structured data which may have been extracted from
        a dataset, or entered by a human) you can use these arguments with the
        `/documents` or `/entities` endpoints.
      parameters:
      - description: >-
          A query string in ElasticSearch query syntax. Can include field
          searches, such as `title:penguin`
        in: query
        name: q
        schema:
          type: string
      - description: >-
          Return facet values for the given metadata field, such as
          `languages`, `countries`, `mime_type` or `extension`. This can be
          specified multiple times for more than one facet to be added.
        in: query
        name: facet
        schema:
          type: string
      - description: >
          Filter the results by the given field. This is useful when used in
          conjunction with facet to create a drill-down mechanism. Useful
          fields are:

          - `collection_id`, documents belonging to a particular collection.

          - `title`, of the document.

          - `file_name`, of the source file.

          - `source_url`, URL of the source file.

          - `extension`, file extension of the source file.

          - `languages`, in the document.

          - `countries`, associated with the document.

          - `keywords`, from the document.

          - `emails`, email addresses mentioned in the document.

          - `domains`, websites mentioned in the document.

          - `phones`, mentioned in the document.

          - `dates`, in any of the following formats: yyyy-MM-dd, yyyy-MM,
          yyyy-MM-d, yyyy-M, yyyy

          - `mime_type`, of the source file.

          - `author`, according to the source file's metadata.

          - `summary`, of the document.

          - `text`, entire text extracted from the document.

          - `created_at`, when the document was added to aleph (yyyy-mm
          -ddThh:ii:ss.uuuuuu).

          - `updated_at`, when the document was modified in aleph (yyyy
          -mm-ddThh:ii:ss.uuuuuu).
        in: query
        name: 'filter:{field_name}'
        schema:
          type: string
      - description: 'The number of results to return, max. 10,000.'
        in: query
        name: limit
        schema:
          type: integer
      - description: >
            The number of results to skip at the beginning of the result set.
        in: query
        name: offset
        schema:
          type: integer
      responses:
        '200':
          description: Resturns a list of entities in result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitiesResponse'
      tags:
      - Entity
    """
    require(request.authz.can_browse_anonymous)
    # enable_cache(vary_user=True)
    parser = SearchQueryParser(request.values, request.authz)
    result = EntitiesQuery.handle(request, parser=parser)
    tag_request(query=result.query.to_text(), prefix=parser.prefix)
    links = {}
    if request.authz.logged_in and result.total <= MAX_PAGE:
        query = list(request.args.items(multi=True))
        links["export"] = url_for("entities_api.export", _query=query)
    return EntitySerializer.jsonify_result(result, extra={"links": links})


@blueprint.route("/api/2/search/export", methods=["POST"])
def export():
    """
    ---
    post:
      summary: Download the results of a search
      description: >-
        Downloads all the results of a search as a zip archive; upto a max of
        10,000 results. The returned file will contain an Excel document with
        structured data as well as the binary files from all matching
        documents.

        Supports the same query parameters as the search API.
      responses:
        '202':
          description: Accepted
      tags:
      - Entity
    """
    require(request.authz.logged_in)
    parser = SearchQueryParser(request.args, request.authz)
    tag_request(query=parser.text, prefix=parser.prefix)
    query = EntitiesQuery(parser)
    label = gettext("Search: %s") % query.to_text()
    export = create_export(
        operation=OP_EXPORT_SEARCH,
        role_id=request.authz.id,
        label=label,
        mime_type=ZIP,
        meta={"query": query.get_full_query()},
    )
    job_id = get_session_id()
    queue_task(None, OP_EXPORT_SEARCH, job_id=job_id, export_id=export.id)
    return ("", 202)


@blueprint.route("/api/2/match", methods=["POST"])
def match():
    """
    ---
    post:
      summary: Query for similar entities
      description: >-
        Query for similar entities matching a given entity inside a given list
        of collections.
      parameters:
      - in: query
        name: collection_ids
        schema:
          type: array
          items:
            type: string
      responses:
        '200':
          description: Returns a list of entities in result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitiesResponse'
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EntityUpdate'
      tags:
      - Entity
    """
    require(request.authz.can_browse_anonymous)
    entity = parse_request("EntityUpdate")
    entity = model.get_proxy(entity, cleaned=False)
    tag_request(schema=entity.schema.name, caption=entity.caption)
    collection_ids = request.args.getlist("collection_ids")
    result = MatchQuery.handle(request, entity=entity, collection_ids=collection_ids)
    return EntitySerializer.jsonify_result(result)


@blueprint.route("/api/2/entities", methods=["POST", "PUT"])
def create():
    """
    ---
    post:
      summary: Create an entity in a collection
      description: >-
        Create an entity in a collection with a given schema and a set of given
        properties in the database. This is not the API you want to be using to
        load bulk data, but only for interactive entity manipulation in the UI.
        Always use the `bulk` API or for loading source datasets, no
        exceptions.
      parameters:
      - in: query
        name: sign
        description: Sign entity IDs referenced in nested properties.
        required: false
        schema:
          type: boolean
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/EntityCreate'
      responses:
        '200':
          description: Resturns the created entity
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Entity'
      tags:
        - Entity
    """
    data = parse_request("EntityCreate")
    collection = get_nested_collection(data, request.authz.WRITE)
    data.pop("id", None)
    if get_flag("validate", default=False):
        validate_entity(data)
    entity_id = upsert_entity(
        data,
        collection,
        authz=request.authz,
        sync=True,
        sign=get_flag("sign", default=False),
        job_id=get_session_id(),
    )
    db.session.commit()
    tag_request(entity_id=entity_id, collection_id=collection.id)
    entity = get_index_entity(entity_id, request.authz.READ)
    return EntitySerializer.jsonify(entity)


@blueprint.route("/api/2/documents/<entity_id>", methods=["GET"])
@blueprint.route("/api/2/entities/<entity_id>", methods=["GET"])
def view(entity_id):
    """
    ---
    get:
      summary: Get an entity
      description: Return the entity with id `entity_id`
      parameters:
      - in: path
        name: entity_id
        required: true
        schema:
          type: string
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
    enable_cache()
    excludes = ["text", "numeric.*"]
    entity = get_index_entity(entity_id, request.authz.READ, excludes=excludes)
    tag_request(collection_id=entity.get("collection_id"))
    proxy = model.get_proxy(entity)
    html = proxy.first("bodyHtml", quiet=True)
    source_url = proxy.first("sourceUrl", quiet=True)
    encoding = proxy.first("encoding", quiet=True)
    entity["safeHtml"] = sanitize_html(html, source_url, encoding=encoding)
    entity["shallow"] = False
    return EntitySerializer.jsonify(entity)


@blueprint.route("/api/2/entities/<entity_id>/similar", methods=["GET"])
def similar(entity_id):
    """
    ---
    get:
      summary: Get similar entities
      description: >
        Get a list of similar entities to the entity with id `entity_id`
      parameters:
      - in: path
        name: entity_id
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
          description: Returns a list of scored and judged entities
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SimilarResponse'
      tags:
      - Entity
    """
    # enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    tag_request(collection_id=entity.get("collection_id"))
    proxy = model.get_proxy(entity)
    result = MatchQuery.handle(request, entity=proxy)
    entities = list(result.results)
    pairs = [(entity_id, s.get("id")) for s in entities]
    judgements = pairwise_judgements(pairs, entity.get("collection_id"))
    result.results = []
    for obj in entities:
        item = {
            "score": compare(model, proxy, obj),
            "judgement": judgements.get((entity_id, obj.get("id"))),
            "collection_id": entity.get("collection_id"),
            "entity": obj,
        }
        result.results.append(item)
    return SimilarSerializer.jsonify_result(result)


@blueprint.route("/api/2/entities/<entity_id>/tags", methods=["GET"])
def tags(entity_id):
    """
    ---
    get:
      summary: Get entity tags
      description: >-
        Get tags for the entity with id `entity_id`.
      parameters:
      - in: path
        name: entity_id
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
      - Entity
    """
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    tag_request(collection_id=entity.get("collection_id"))
    results = entity_tags(model.get_proxy(entity), request.authz)
    return jsonify({"status": "ok", "total": len(results), "results": results})


@blueprint.route("/api/2/entities/<entity_id>", methods=["POST", "PUT"])
def update(entity_id):
    """
    ---
    post:
      summary: Update an entity
      description: >
        Update the entity with id `entity_id`. This only applies to
        entities which are backed by a database row, i.e. not any
        entities resulting from a mapping or bulk load.
      parameters:
      - in: path
        name: entity_id
        required: true
        schema:
          type: string
          format: entity_id
      - in: query
        name: sign
        description: Sign entity IDs referenced in nested properties.
        required: false
        schema:
          type: boolean
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
    data = parse_request("EntityUpdate")
    try:
        entity = get_index_entity(entity_id, request.authz.WRITE)
        require(check_write_entity(entity, request.authz))
        collection = get_db_collection(entity.get("collection_id"), request.authz.WRITE)
    except NotFound:
        collection = get_nested_collection(data, request.authz.WRITE)
    tag_request(collection_id=collection.id)
    data["id"] = entity_id
    if get_flag("validate", default=False):
        validate_entity(data)
    entity_id = upsert_entity(
        data,
        collection,
        authz=request.authz,
        sync=get_flag("sync", default=True),
        sign=get_flag("sign", default=False),
        job_id=get_session_id(),
    )
    db.session.commit()
    return view(entity_id)


@blueprint.route("/api/2/entities/<entity_id>", methods=["DELETE"])
def delete(entity_id):
    """
    ---
    delete:
      summary: Delete an entity
      description: Delete the entity with id `entity_id`
      parameters:
      - in: path
        name: entity_id
        required: true
        schema:
          type: string
      responses:
        '204':
          description: No Content
      tags:
      - Entity
    """
    entity = get_index_entity(entity_id, request.authz.WRITE)
    collection = get_db_collection(entity.get("collection_id"), request.authz.WRITE)
    tag_request(collection_id=collection.id)
    sync = get_flag("sync", default=True)
    job_id = get_session_id()
    delete_entity(collection, entity, sync=sync, job_id=job_id)
    return ("", 204)


@blueprint.route("/api/2/entities/<entity_id>/expand", methods=["GET"])
def expand(entity_id):
    """
    ---
    get:
      summary: Expand an entity to get its adjacent entities
      description: >-
        Get the property-wise list of entities adjacent to the entity
        with id `entity_id`.
      parameters:
      - in: path
        name: entity_id
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
      - Entity
    """
    entity = get_index_entity(entity_id, request.authz.READ)
    proxy = model.get_proxy(entity)
    collection_id = entity.get("collection_id")
    tag_request(collection_id=collection_id)
    parser = QueryParser(request.args, request.authz, max_limit=MAX_EXPAND_ENTITIES)
    properties = parser.filters.get("property")
    results = expand_proxies(
        [proxy],
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


@blueprint.route("/api/2/entities/<entity_id>/entitysets", methods=["GET"])
def entitysets(entity_id):
    """Returns a list of entitysets which the entity has references in
    ---
    get:
      summary: Shows EntitySets which reference the given entity
      description: >-
        Search for all entitysets which reference the given entity. The entity
        sets can be filtered based on it's collection id, label, type or the
        judgement of the entity within the set.
      parameters:
      - in: path
        name: entity_id
        required: true
        schema:
          type: string
      - in: query
        name: 'filter:type'
        description: Restrict to a EntitySets of a particular type
        required: false
        schema:
          items:
            type: string
          type: array
      - in: query
        name: 'filter:label'
        description: Restrict to a EntitySets with a particular label
        required: false
        schema:
          items:
            type: string
          type: array
      - in: query
        name: 'filter:judgement'
        description: Restrict to a specific profile judgement
        required: false
        schema:
          items:
            type: string
          type: array
      - in: query
        name: 'filter:collection_id'
        description: Restrict to entity sets within particular collections
        schema:
          items:
            type: string
          type: array
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/EntitySet'
          description: OK
      tags:
      - Entity
      - Profile
    """
    entity = get_index_entity(entity_id, request.authz.READ)

    parser = QueryParser(request.args, request.authz)
    collection_ids = [
        cid
        for cid in parser.filters.get("collection_id", [])
        if request.authz.can(cid, request.authz.READ)
    ]
    judgements = parser.filters.get("judgement")
    labels = parser.filters.get("label")
    types = parser.filters.get("type")

    if judgements is not None:
        judgements = list(map(Judgement, judgements))
    if not collection_ids:
        collection_ids = request.authz.collections(request.authz.READ)

    entitysets = EntitySet.by_entity_id(
        entity["id"],
        collection_ids=collection_ids,
        judgements=judgements,
        types=types,
        labels=labels,
    )
    result = DatabaseQueryResult(request, entitysets, parser=parser)
    return EntitySetSerializer.jsonify_result(result)
