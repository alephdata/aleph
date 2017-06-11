import six
import json
import logging
import fingerprints
from pprint import pprint  # noqa
from urlparse import urljoin
from flask import Blueprint, request, url_for
from apikit import jsonify
from werkzeug.exceptions import BadRequest

from aleph.events import log_event
from aleph.search import QueryState
from aleph.util import ensure_list
from aleph.core import app_url, app_title, schemata
from aleph.search.entities import suggest_entities, similar_entities

# See: https://github.com/OpenRefine/OpenRefine/wiki/Reconciliation-Service-API

blueprint = Blueprint('reconcile_api', __name__)
log = logging.getLogger(__name__)


def entity_link(id):
    return urljoin(app_url, '/entities/%s' % id)


def get_freebase_types():
    types = []
    for schema in schemata.schemata.values():
        if schema.section == schema.ENTITY:
            types.append({
                'id': schema.name,
                'name': schema.label
            })
    return types


def reconcile_op(query):
    """Reconcile operation for a single query."""
    state = QueryState({
        'limit': query.get('limit', '5'),
        'strict': 'false'
    }, request.authz)

    name = query.get('query', '')
    entity = {
        'id': 'fake',
        'names': [name],
        'fingerprints': [fingerprints.generate(name)],
        'schemata': ensure_list(query.get('type'))
    }

    for p in query.get('properties', []):
        entity[p.get('pid')] = ensure_list(p.get('v'))

    suggested = similar_entities(entity, state)
    matches = []
    for ent in suggested.get('results'):
        types = [t for t in get_freebase_types() if ent['schema'] == t['id']]
        matches.append({
            'id': ent.get('id'),
            'name': ent.get('name'),
            'type': types,
            'score': min(100, ent.get('score') * 10),
            'uri': entity_link(ent.get('id')),
            'match': ent.get('name') == name
        })
    log.info("Reconciled: %r -> %d matches", name, len(matches))
    return {
        'result': matches,
        'num': len(matches)
    }


def reconcile_index():
    domain = app_url.strip('/')
    api_key = request.authz.role.api_key if request.authz.logged_in else None
    meta = {
        'name': six.text_type(app_title),
        'identifierSpace': 'http://rdf.freebase.com/ns/type.object.id',
        'schemaSpace': 'http://rdf.freebase.com/ns/type.object.id',
        'view': {
            'url': entity_link('{{id}}')
        },
        'preview': {
            'url': entity_link('{{id}}') + '?api_key=%s' % api_key,
            'width': 800,
            'height': 400
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
            'id': 'Entity',
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
    data = request.args.copy()
    data.update(request.form.copy())
    log_event(request)

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
    prefix = request.args.get('prefix', '').lower()
    schemas = request.args.getlist('type')
    types = get_freebase_types()
    matches = []
    suggested = suggest_entities(prefix, request.authz, schemas=schemas)
    for entity in suggested.get('results'):
        types_ = [t for t in types if entity['schema'] == t['id']]
        matches.append({
            'quid': entity.get('id'),
            'id': entity.get('id'),
            'name': entity.get('name'),
            'n:type': types_[0],
            'type': [types_[0]['name']],
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
    prefix = request.args.get('prefix', '').lower().strip()
    properties = [{
        'id': 'countries',
        'name': 'Countries',
        'match': 'Jurisdiction, Country, Nationality'
    }, {
        'id': 'identifiers',
        'name': 'External Identifiers',
        'match': 'Data identifier code company id'
    }, {
        'id': 'phones',
        'name': 'Phones',
        'match': 'Phone number'
    }, {
        'id': 'emails',
        'name': 'EMails',
        'match': 'E-Mail addresses, Email'
    }, {
        'id': 'addresses',
        'name': 'Addresses',
        'match': 'Geographic addresses'
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
