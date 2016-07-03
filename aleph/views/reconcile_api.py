import json
import logging
from urlparse import urljoin
from flask import Blueprint, request, url_for
from apikit import jsonify
from werkzeug.exceptions import BadRequest

from aleph import authz
from aleph.core import get_app_url, get_app_title
from aleph.model.validation import implied_schemas, resolver
from aleph.search.entities import suggest_entities


blueprint = Blueprint('reconcile_api', __name__)
log = logging.getLogger(__name__)

DEFAULT_TYPE = '/entity/entity.json#'


def entity_link(id):
    return urljoin(get_app_url(), '/search?entity=%s' % id)


def get_freebase_types():
    types = []
    for uri in implied_schemas(DEFAULT_TYPE):
        _, schema = resolver.resolve(uri)
        types.append({
            'id': uri,
            'name': schema.get('title')
        })
    return types


def reconcile_op(query):
    """Reconcile operation for a single query."""
    name = query.get('query', '').strip()
    size = int(query.get('limit', '5'))
    schemas = implied_schemas(query.get('type'))
    types = get_freebase_types()
    # TODO: jurisdiction_code etc.
    # for p in query.get('properties', []):
    #    q[p.get('pid')] = p.get('v')
    matches = []
    suggested = suggest_entities(name, schemas=schemas, size=size)
    for entity in suggested.get('results'):
        types = [t for t in types if entity['$schema'] == t['id']]
        matches.append({
            'id': entity.get('id'),
            'name': entity.get('name'),
            'type': types,
            'score': entity.get('score') * 10,
            'uri': entity_link(entity.get('id')),
            'match': entity['match']
        })
    log.info("Reconciled: %r -> %d matches", name, len(matches))
    return {
        'result': matches,
        'num': len(matches)
    }


def reconcile_index():
    domain = get_app_url().strip('/')
    api_key = request.auth_role.api_key if authz.logged_in() else None
    preview_uri = entity_link('{{id}}') + '&preview=true&api_key=%s' % api_key
    meta = {
        'name': get_app_title(),
        'identifierSpace': 'http://rdf.freebase.com/ns/type.object.id',
        'schemaSpace': 'http://rdf.freebase.com/ns/type.object.id',
        'view': {'url': entity_link('{{id}}')},
        'preview': {
            'url': preview_uri,
            'width': 600,
            'height': 300
        },
        'suggest': {
            'entity': {
                'service_url': domain,
                'service_path': url_for('reconcile_api.suggest_entity',
                                        api_key=api_key)
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
            'id': DEFAULT_TYPE,
            'name': 'Persons and Companies'
        }]
    }
    return jsonify(meta)


@blueprint.route('/api/freebase/reconcile', methods=['GET', 'POST'])
def reconcile():
    """
    Reconciliation API, emulates Google Refine API.

    See: http://code.google.com/p/google-refine/wiki/ReconciliationServiceApi
    """
    # authz.require(authz.system_read())
    data = request.args.copy()
    data.update(request.form.copy())

    if 'query' in data:
        # single
        q = data.get('query')
        if q.startswith('{'):
            try:
                q = json.loads(q)
            except ValueError:
                raise BadRequest()
        else:
            q = data
        return jsonify(reconcile_op(q))
    elif 'queries' in data:
        # multiple requests in one query
        qs = data.get('queries')
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
    # See: https://github.com/OpenRefine/OpenRefine/wiki/Reconciliation-Service-API
    prefix = request.args.get('prefix', '').lower()
    schemas = request.args.getlist('type')
    schemas = list(set([implied_schemas(s) for s in schemas]))
    types = get_freebase_types()
    matches = []
    for entity in suggest_entities(prefix, schemas=schemas).get('results'):
        types_ = [t for t in types if entity['$schema'] == t['id']]
        matches.append({
            'quid': entity.get('id'),
            'id': entity.get('id'),
            'name': entity.get('name'),
            'n:type': types_[0],
            'type': [types[0]['name']],
            'r:score': entity.get('score'),
        })
    return jsonify({
        "code": "/api/status/ok",
        "status": "200 OK",
        "prefix": request.args.get('prefix', ''),
        "result": matches
    })


@blueprint.route('/api/freebase/property', methods=['GET', 'POST'])
def suggest_property():
    # authz.require(authz.system_read())
    prefix = request.args.get('prefix', '').lower().strip()
    properties = [{
        'id': 'jurisdiction_code',
        'name': 'Jurisdiction',
        'match': 'Jurisdiction, Country, Nationality'
    }, {
        'id': 'identifiers.identifier',
        'name': 'External Identifier',
        'match': 'Data identifier code company id'
    }, {
        'id': 'contact_details.value',
        'name': 'Contact Detail',
        'match': 'Contact detail, phone number, email, fax, fon'
    }]
    matches = []
    for prop in properties:
        name = prop.pop('match', prop.get('name')).lower()
        if not len(prefix) or prefix in name:
            prop.update({
                'quid': prop['id'],
                'r:score': 100,
                'n:type': {
                    'id': '/properties/property',
                    'name': 'Property'
                }
            })
            matches.append(prop)
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
