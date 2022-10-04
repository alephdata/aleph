import json
import logging
from pprint import pprint  # noqa
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from followthemoney import model

from aleph.core import settings, url_for, talisman
from aleph.model import Entity
from aleph.search import SearchQueryParser
from aleph.search import EntitiesQuery, MatchQuery
from aleph.views.util import jsonify, get_index_collection, require
from aleph.index.collections import get_collection_things
from aleph.logic.util import entity_url
from aleph.index.util import unpack_result
from aleph.views.context import tag_request

# See: https://github.com/OpenRefine/OpenRefine/wiki/Reconciliation-Service-API
blueprint = Blueprint("reconcile_api", __name__)
log = logging.getLogger(__name__)
CSP = {
    "default-src": "'*'",
    "script-src": "'*'",
    "connect-src": "'*'",
}


def get_freebase_types():
    types = []
    for schema in model:
        if schema.matchable:
            types.append(get_freebase_type(schema))
    return types


def get_freebase_type(schema):
    return {"id": schema.name, "name": schema.label}


def entity_matches(result):
    for doc in result.get("hits").get("hits"):
        entity = unpack_result(doc)
        proxy = model.get_proxy(entity)
        yield {
            "id": proxy.id,
            "name": proxy.caption,
            "n:type": get_freebase_type(proxy.schema),
            "type": [get_freebase_type(proxy.schema)],
            "r:score": doc.get("_score"),
            "uri": entity_url(proxy.id, _relative=True),
            "match": False,
        }


def reconcile_index(collection=None):
    domain = settings.APP_UI_URL.strip("/")
    label = settings.APP_TITLE
    suggest_query = []
    if request.authz.id:
        suggest_query.append(("api_key", request.authz.role.api_key))
    schemata = list(model)
    if collection is not None:
        label = "%s (%s)" % (collection.get("label"), label)
        suggest_query.append(("filter:collection_id", collection.get("id")))
        things = get_collection_things(collection.get("id"))
        schemata = [model.get(s) for s in things.keys()]
    return jsonify(
        {
            "name": label,
            "identifierSpace": "http://rdf.freebase.com/ns/type.object.id",
            "schemaSpace": "http://rdf.freebase.com/ns/type.object.id",
            "view": {"url": entity_url("{{id}}")},
            "preview": {"url": entity_url("{{id}}"), "width": 800, "height": 400},
            "suggest": {
                "entity": {
                    "service_url": domain,
                    "service_path": url_for(
                        ".suggest_entity",
                        _query=suggest_query,
                        _relative=True,
                    ),
                },
                "type": {
                    "service_url": domain,
                    "service_path": url_for(".suggest_type", _relative=True),
                },
                "property": {
                    "service_url": domain,
                    "service_path": url_for(".suggest_property", _relative=True),
                },
            },
            "defaultTypes": [get_freebase_type(s) for s in schemata if s.matchable],
        }
    )


@blueprint.route("/api/freebase/reconcile", methods=["GET", "POST"])
@blueprint.route(
    "/api/2/collections/<collection_id>/reconcile", methods=["GET", "POST"]
)
@talisman(content_security_policy=CSP)
def reconcile(collection_id=None):
    """Reconciliation API, emulates Google Refine API.
    ---
    post:
      summary: Freebase reconciliation API
      description: >
        An implementation of the reconciliation API from Freebase, used
        by OpenRefine to match entities.
      parameters:
      - description: The collection ID.
        in: path
        name: collection_id
        required: true
        schema:
          minimum: 1
          type: integer
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                query:
                  type: object
      responses:
        '200':
          description: OK
      tags:
      - Collection
    """
    require(request.authz.can_browse_anonymous)
    collection = None
    if collection_id is not None:
        collection = get_index_collection(collection_id)
    query = request.values.get("query")
    if query is not None:
        # single
        try:
            query = json.loads(query)
        except ValueError:
            query = {"query": query}
        return jsonify(reconcile_op(query, collection))

    queries = request.values.get("queries")
    if queries is not None:
        # multiple requests in one query
        try:
            qs = json.loads(queries)
            results = {}
            for k, q in qs.items():
                results[k] = reconcile_op(q, collection)
            return jsonify(results)
        except ValueError:
            raise BadRequest()
    return reconcile_index(collection)


def reconcile_op(query, collection=None):
    """Reconcile operation for a single query."""
    log.info("Reconcile: %r", query)
    args = {"limit": query.get("limit", "5")}
    if collection is not None:
        args["filter:collection_id"] = collection.get("id")
    parser = SearchQueryParser(args, request.authz)
    schema = query.get("type") or Entity.LEGAL_ENTITY
    proxy = model.make_entity(schema)
    proxy.add("name", query.get("query"))
    for p in query.get("properties", []):
        proxy.add(p.get("pid"), p.get("v"), quiet=True)

    query = MatchQuery(parser, entity=proxy)
    matches = list(entity_matches(query.search()))
    return {"result": matches, "num": len(matches)}


@blueprint.route("/api/freebase/suggest", methods=["GET", "POST"])
@talisman(content_security_policy=CSP)
def suggest_entity():
    """Suggest API, emulates Google Refine API."""
    require(request.authz.can_browse_anonymous)
    prefix = request.args.get("prefix", "")
    tag_request(prefix=prefix)
    types = request.args.getlist("type") or Entity.THING
    args = {
        "prefix": prefix,
        "filter:schemata": types,
        "filter:collection_id": request.args.getlist("filter:collection_id"),
    }
    parser = SearchQueryParser(args, request.authz)
    query = EntitiesQuery(parser)
    result = query.search()
    matches = list(entity_matches(result))
    return jsonify(
        {
            "code": "/api/status/ok",
            "status": "200 OK",
            "prefix": prefix,
            "result": matches,
        }
    )


@blueprint.route("/api/freebase/property", methods=["GET", "POST"])
@talisman(content_security_policy=CSP)
def suggest_property():
    require(request.authz.can_browse_anonymous)
    prefix = request.args.get("prefix", "").lower().strip()
    tag_request(prefix=prefix)
    schema = request.args.get("schema", Entity.THING)
    matches = []
    for prop in model.get(schema).properties.values():
        match = not len(prefix)
        match = prefix in prop.name.lower()
        match = match or prefix in prop.label.lower()
        if match:
            matches.append(
                {
                    "id": prop.name,
                    "quid": prop.name,
                    "name": prop.label,
                    "r:score": 100,
                    "n:type": {"id": "/properties/property", "name": "Property"},
                }
            )
    return jsonify(
        {
            "code": "/api/status/ok",
            "status": "200 OK",
            "prefix": request.args.get("prefix", ""),
            "result": matches,
        }
    )


@blueprint.route("/api/freebase/type", methods=["GET", "POST"])
@talisman(content_security_policy=CSP)
def suggest_type():
    require(request.authz.can_browse_anonymous)
    prefix = request.args.get("prefix", "").lower().strip()
    tag_request(prefix=prefix)
    matches = []
    for schema in model:
        match = not len(prefix)
        match = match or prefix in schema.name.lower()
        match = match or prefix in schema.label.lower()
        if match and schema.matchable:
            matches.append(get_freebase_type(schema))
    return jsonify(
        {
            "code": "/api/status/ok",
            "status": "200 OK",
            "prefix": request.args.get("prefix", ""),
            "result": matches,
        }
    )
