from flask import Blueprint, request
from apikit import jsonify
from apikit import get_limit, get_offset

from aleph import authz
from aleph.core import url_for, es, es_index
from aleph.model import Entity
from aleph.views.cache import etag_cache_keygen
from aleph.search.queries import document_query, get_list_facets
from aleph.search.attributes import available_attributes
from aleph.index.mapping import TYPE_DOCUMENT

blueprint = Blueprint('search', __name__)


def add_urls(doc):
    return doc


def transform_facets(aggregations):
    coll = aggregations.get('all', {}).get('ftr', {}).get('collections', {})
    coll = coll.get('buckets', [])

    lists = {}
    for list_id in get_list_facets(request.args):
        key = 'list_%s' % list_id
        ents = aggregations.get(key, {}).get('inner', {})
        ents = ents.get('entities', {}).get('buckets', [])
        objs = Entity.by_id_set([e.get('key') for e in ents])
        entities = []
        for entity in ents:
            entity['entity'] = objs.get(entity.get('key'))
            if entity['entity'] is not None:
                entities.append(entity)
        lists[list_id] = entities

    return {
        'sources': coll,
        'lists': lists
    }


@blueprint.route('/api/1/query')
def query():
    etag_cache_keygen()
    query = document_query(request.args,
                           lists=authz.lists(authz.READ),
                           sources=authz.sources(authz.READ))
    query['size'] = get_limit()
    query['from'] = get_offset()
    if query['from'] > 0 and 'aggregations' in query:
        del query['aggregations']

    result = es.search(index=es_index, doc_type=TYPE_DOCUMENT, body=query)
    hits = result.get('hits', {})
    output = {
        'status': 'ok',
        'results': [],
        'offset': query['from'],
        'limit': query['size'],
        'took': result.get('took'),
        'total': hits.get('total'),
        'facets': {}
    }
    next_offset = output['offset'] + output['limit']
    if output['total'] > next_offset:
        params = {'offset': next_offset}
        for k, v in request.args.iterlists():
            if k in ['attributefacet', 'listfacet', 'offset']:
                continue
            params[k] = v
        output['next_url'] = url_for('search.query', **params)

    output['facets'] = transform_facets(result.get('aggregations', {}))

    for doc in hits.get('hits', []):
        res = doc.get('_source')
        res['score'] = doc.get('_score')
        output['results'].append(add_urls(res))
    return jsonify(output)


@blueprint.route('/api/1/query/attributes')
def attributes():
    etag_cache_keygen()
    attributes = available_attributes(request.args,
        sources=authz.sources(authz.READ), # noqa
        lists=authz.lists(authz.READ)) # noqa
    return jsonify(attributes)
