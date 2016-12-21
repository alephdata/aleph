import logging
from werkzeug.exceptions import NotFound
from flask import Blueprint, request
from apikit import jsonify

from aleph.core import datasets
from aleph.search import QueryState
from aleph.search import entities_query
from aleph.views.cache import enable_cache


log = logging.getLogger(__name__)
blueprint = Blueprint('datasets_api', __name__)


@blueprint.route('/api/1/datasets', methods=['GET'])
def index():
    enable_cache(vary_user=True)
    results = [d for d in datasets if request.authz.check_roles(d.roles)]
    state = QueryState({
        'filter:dataset': [d.name for d in results],
        'facet': 'dataset',
        'limit': 0
    }, request.authz)
    res = entities_query(state)
    values = res.get('facets', {}).get('dataset', {}).get('values', [])
    counts = {v.get('id'): v.get('count') for v in values}
    for dataset in results:
        dataset.entities_count = counts.get(dataset.name)
    return jsonify({
        'results': results,
        'total': len(results),
        'total_entities_count': res.get('total')
    })


@blueprint.route('/api/1/datasets/<name>')
def view(name):
    enable_cache(vary_user=True)
    try:
        dataset = datasets.get(name)
    except NameError:
        raise NotFound()
    request.authz.require(request.authz.check_roles(dataset.roles))
    state = QueryState({
        'filter:dataset': dataset.name,
        'facet': ['schema', 'countries'],
        'limit': 0
    }, request.authz)
    res = entities_query(state)
    data = dataset.to_dict()
    data['facets'] = res.get('facets', {})
    data['doc_count'] = res.get('total')
    return jsonify(data)
