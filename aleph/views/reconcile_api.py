import json
import math
import logging
from pprint import pprint  # noqa
from flask import Blueprint, request
from werkzeug.exceptions import BadRequest
from followthemoney import model
from followthemoney.compare import compare

from aleph.core import settings, url_for
from aleph.model import Entity
from aleph.search import SearchQueryParser
from aleph.search import EntitiesQuery, MatchQuery
from aleph.views.util import jsonify
from aleph.logic.util import entity_url
from aleph.index.util import unpack_result

# See: https://github.com/OpenRefine/OpenRefine/wiki/Reconciliation-Service-API

blueprint = Blueprint('reconcile_api', __name__)
log = logging.getLogger(__name__)


def get_freebase_types():
    types = []
    for schema in model:
        if schema.matchable:
            types.append({
                'id': schema.name,
                'name': schema.label
            })
    return types


def reconcile_op(query):
    """Reconcile operation for a single query."""
    parser = SearchQueryParser({
        'limit': query.get('limit', '5'),
        'strict': 'false'
    }, request.authz)

    name = query.get('query', '')
    schema = query.get('type') or Entity.THING
    proxy = model.make_entity(schema)
    proxy.add('name', query.get('query', ''))
    for p in query.get('properties', []):
        proxy.add(p.get('pid'), p.get('v'), quiet=True)

    query = MatchQuery(parser, entity=proxy)
    matches = []
    for doc in query.search().get('hits').get('hits'):
        entity = model.get_proxy(unpack_result(doc))
        score = math.ceil(compare(model, proxy, entity) * 100)
        match = {
            'id': entity.id,
            'name': entity.caption,
            'score': score,
            'uri': entity_url(entity.id),
            'match': False
        }
        for type_ in get_freebase_types():
            if entity.schema.name == type_['id']:
                match['type'] = [type_]
        matches.append(match)

    log.info("Reconciled: %r -> %d matches", name, len(matches))
    return {
        'result': matches,
        'num': len(matches)
    }


def reconcile_index():
    domain = settings.APP_UI_URL.strip('/')
    meta = {
        'name': settings.APP_TITLE,
        'identifierSpace': 'http://rdf.freebase.com/ns/type.object.id',
        'schemaSpace': 'http://rdf.freebase.com/ns/type.object.id',
        'view': {
            'url': entity_url('{{id}}')
        },
        'preview': {
            'url': entity_url('{{id}}'),
            'width': 800,
            'height': 400
        },
        'suggest': {
            'entity': {
                'service_url': domain,
                'service_path': url_for('reconcile_api.suggest_entity',
                                        _authorize=True)
            },
            'type': {
                'service_url': domain,
                'service_path': url_for('reconcile_api.suggest_type')
            },
            'property': {
                'service_url': domain,
                'service_path': url_for('reconcile_api.suggest_property')
            }
        },
        'defaultTypes': [{
            'id': Entity.THING,
            'name': model.get(Entity.THING).label
        }]
    }
    return jsonify(meta)


@blueprint.route('/api/freebase/reconcile', methods=['GET', 'POST'])
def reconcile():
    """
    Reconciliation API, emulates Google Refine API.

    See: http://code.google.com/p/google-refine/wiki/ReconciliationServiceApi
    """
    if 'query' in request.values:
        # single
        q = request.values.get('query')
        if q.startswith('{'):
            try:
                q = json.loads(q)
            except ValueError:
                raise BadRequest()
        else:
            q = request.values
        return jsonify(reconcile_op(q))
    elif 'queries' in request.values:
        # multiple requests in one query
        qs = request.values.get('queries')
        try:
            qs = json.loads(qs)
        except ValueError:
            raise BadRequest()
        queries = {}
        for k, q in qs.items():
            queries[k] = reconcile_op(q)
        return jsonify(queries)
    else:
        return reconcile_index()


@blueprint.route('/api/freebase/suggest', methods=['GET', 'POST'])
def suggest_entity():
    """Suggest API, emulates Google Refine API."""
    args = {
        'prefix': request.args.get('prefix'),
        'filter:schemata': request.args.getlist('type')
    }
    matches = []
    parser = SearchQueryParser(args, request.authz)
    if parser.prefix is not None:
        query = EntitiesQuery(parser)
        for doc in query.search().get('hits').get('hits'):
            source = doc.get('_source')
            match = {
                'quid': doc.get('_id'),
                'id': doc.get('_id'),
                'name': source.get('name'),
                'r:score': doc.get('_score'),
            }
            for type_ in get_freebase_types():
                if source.get('schema') == type_['id']:
                    match['n:type'] = type_
                    match['type'] = [type_['name']]
            matches.append(match)

    return jsonify({
        "code": "/api/status/ok",
        "status": "200 OK",
        "prefix": request.args.get('prefix', ''),
        "result": matches
    })


@blueprint.route('/api/freebase/property', methods=['GET', 'POST'])
def suggest_property():
    prefix = request.args.get('prefix', '').lower().strip()
    matches = []
    for prop in model.properties:
        match = not len(prefix)
        if not match:
            match = prefix in prop.name.lower()
            match = match or prefix in prop.label.lower()
        if match:
            matches.append({
                'id': prop.name,
                'quid': prop.name,
                'name': prop.label,
                'r:score': 100,
                'n:type': {
                    'id': '/properties/property',
                    'name': 'Property'
                }
            })
    return jsonify({
        "code": "/api/status/ok",
        "status": "200 OK",
        "prefix": request.args.get('prefix', ''),
        "result": matches
    })


@blueprint.route('/api/freebase/type', methods=['GET', 'POST'])
def suggest_type():
    prefix = request.args.get('prefix', '').lower().strip()
    matches = []
    for type_ in get_freebase_types():
        name = type_.get('name').lower()
        if not len(prefix) or prefix in name:
            matches.append(type_)
    return jsonify({
        "code": "/api/status/ok",
        "status": "200 OK",
        "prefix": request.args.get('prefix', ''),
        "result": matches
    })
