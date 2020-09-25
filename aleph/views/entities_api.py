import logging
from urllib.parse import quote
from urlnormalizer import query_string
from flask import Blueprint, request
from flask_babel import gettext
from werkzeug.exceptions import NotFound
from followthemoney import model
from pantomime.types import ZIP

from aleph.core import db, url_for
from aleph.model import QueryLog
from aleph.search import EntitiesQuery, MatchQuery
from aleph.search.parser import SearchQueryParser, QueryParser
from aleph.logic.entities import upsert_entity, delete_entity
from aleph.logic.entities import entity_references, entity_tags, entity_expand
from aleph.logic.entities import validate_entity, check_write_entity
from aleph.logic.html import sanitize_html
from aleph.logic.export import create_export
from aleph.index.util import MAX_PAGE
from aleph.views.util import get_index_entity, get_db_collection
from aleph.views.util import jsonify, parse_request, get_flag
from aleph.views.util import require, get_nested_collection, get_session_id
from aleph.views.context import enable_cache, tag_request
from aleph.views.serializers import EntitySerializer
from aleph.settings import MAX_EXPAND_ENTITIES
from aleph.queues import queue_task, OP_EXPORT_SEARCH_RESULTS

log = logging.getLogger(__name__)
blueprint = Blueprint("entities_api", __name__)


@blueprint.route("/api/2/search", methods=["GET"])
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
    # enable_cache(vary_user=True)
    parser = SearchQueryParser(request.args, request.authz)
    if parser.text:
        QueryLog.save(request.authz.id, request._session_id, parser.text)
        db.session.commit()
    tag_request(query=parser.text, prefix=parser.prefix)
    result = EntitiesQuery.handle(request, parser=parser)
    links = {}
    if request.authz.logged_in and result.total <= MAX_PAGE:
        query = list(request.args.items(multi=True))
        links["export"] = url_for(
            "entities_api.export", _authz=request.authz, _query=query
        )
    return EntitySerializer.jsonify_result(result, extra={"links": links})


@blueprint.route("/api/2/search/export", methods=["POST"])  # noqa
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
        operation=OP_EXPORT_SEARCH_RESULTS,
        role_id=request.authz.id,
        label=label,
        mime_type=ZIP,
        meta={"query": query.get_full_query()},
    )
    job_id = get_session_id()
    payload = {"export_id": export.id}
    queue_task(None, OP_EXPORT_SEARCH_RESULTS, job_id=job_id, payload=payload)
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
    entity_id = upsert_entity(data, collection, authz=request.authz, sync=True)
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
          description: Returns a list of entities
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EntitiesResponse'
      tags:
      - Entity
    """
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    tag_request(collection_id=entity.get("collection_id"))
    entity = model.get_proxy(entity)
    result = MatchQuery.handle(request, entity=entity)
    return EntitySerializer.jsonify_result(result)


@blueprint.route("/api/2/entities/<entity_id>/references", methods=["GET"])
def references(entity_id):
    """
    ---
    get:
      summary: Get entity references
      description: >-
        Get the schema-wise aggregation of references to the entity with id
        `entity_id`. This can be used to find and display adjacent entities.
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
                      $ref: '#/components/schemas/EntityReference'
      tags:
      - Entity
    """
    enable_cache()
    entity = get_index_entity(entity_id, request.authz.READ)
    tag_request(collection_id=entity.get("collection_id"))
    results = []
    for prop, total in entity_references(entity, request.authz):
        results.append({"count": total, "property": prop, "schema": prop.schema.name})
    return jsonify({"status": "ok", "total": len(results), "results": results})


@blueprint.route("/api/2/entities/<entity_id>/tags", methods=["GET"])
def tags(entity_id):
    """
    ---
    get:
      summary: Get entity tags
      description: >-
        Get tags for the entity with id `entity_id`. Tags include the query
        string to make a search by that particular tag.
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
    results = []
    for (field, value, total) in entity_tags(entity, request.authz):
        qvalue = quote(value.encode("utf-8"))
        key = ("filter:%s" % field, qvalue)
        qid = query_string([key])
        results.append({"id": qid, "value": value, "field": field, "count": total})
    results.sort(key=lambda p: p["count"], reverse=True)
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
    sync = get_flag("sync", default=True)
    entity_id = upsert_entity(data, collection, authz=request.authz, sync=sync)
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
    delete_entity(collection, entity, sync=sync)
    db.session.commit()
    return ("", 204)


@blueprint.route("/api/2/entities/<entity_id>/expand", methods=["GET"])
def expand(entity_id):
    """Returns a list of diagrams for the role
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
      - in: query
        name: edge_types
        description: types of edges to expand. Must is a matchable FtM type
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
    edge_types = request.args.getlist("edge_types")
    collection_id = entity.get("collection_id")
    tag_request(collection_id=collection_id)
    parser = QueryParser(request.args, request.authz, max_limit=MAX_EXPAND_ENTITIES)
    properties = parser.filters.get("property")
    results = []
    for (prop, total, proxies) in entity_expand(
        entity,
        collection_ids=[collection_id],
        edge_types=edge_types,
        properties=properties,
        authz=request.authz,
        limit=parser.limit,
    ):
        results.append(
            {
                "count": total,
                "property": prop.name,
                "entities": [proxy.to_dict() for proxy in proxies],
            }
        )
    return jsonify(
        {
            "status": "ok",
            "total": sum(result["count"] for result in results),
            "results": results,
        }
    )
