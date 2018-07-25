import json
import logging
import fingerprints
from pprint import pprint  # noqa
from banal import ensure_list
from flask import Blueprint, request, url_for
from werkzeug.exceptions import BadRequest
from followthemoney import model

from aleph.core import settings
from aleph.model import Entity, Role
from aleph.search import SearchQueryParser
from aleph.search import SuggestEntitiesQuery, SimilarEntitiesQuery
from aleph.views.util import jsonify
from aleph.logic.util import entity_url

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
    entity = {
        'id': 'fake',
        'names': [name],
        'fingerprints': [fingerprints.generate(name)],
        'schemata': ensure_list(schema),
        'schema': schema
    }

    for p in query.get('properties', []):
        entity[p.get('pid')] = ensure_list(p.get('v'))

    query = SimilarEntitiesQuery(parser, entity=entity)
    matches = []
    for doc in query.search().get('hits').get('hits'):
        source = doc.get('_source')
        match = {
            'id': doc.get('_id'),
            'name': source.get('name'),
            'score': min(100, doc.get('_score') * 10),
            'uri': entity_url(doc.get('_id')),
            'match': source.get('name') == name
        }
        for type_ in get_freebase_types():
            if source['schema'] == type_['id']:
                match['type'] = [type_]
        matches.append(match)

    log.info("Reconciled: %r -> %d matches", name, len(matches))
    return {
        'result': matches,
        'num': len(matches)
    }


def reconcile_index():
    domain = settings.APP_UI_URL.strip('/')
    api_key = None
    if request.authz.logged_in:
        role = Role.by_id(request.authz.id)
        api_key = role.api_key
    meta = {
        'name': settings.APP_TITLE,
        'identifierSpace': 'http://rdf.freebase.com/ns/type.object.id',
        'schemaSpace': 'http://rdf.freebase.com/ns/type.object.id',
        'view': {
            'url': entity_url('{{id}}')
        },
        'preview': {
            'url': entity_url('{{id}}') + '?api_key=%s' % api_key,
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
        query = SuggestEntitiesQuery(parser)
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
