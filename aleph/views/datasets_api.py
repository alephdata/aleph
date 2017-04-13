import logging
from collections import defaultdict
from werkzeug.exceptions import NotFound
from flask import Blueprint, request
from apikit import jsonify
from dalet import COUNTRY_NAMES

from aleph.core import datasets, get_config
from aleph.search import QueryState, entities_query
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

    countries_facet = defaultdict(int)
    category_facet = defaultdict(int)
    countries_filter = set(request.args.getlist('filter:countries'))
    category_filter = set(request.args.getlist('filter:category'))

    filtered = []
    for dataset in results:
        dataset.entities_count = counts.get(dataset.name)
        if len(category_filter) and dataset.category not in category_filter:
            continue
        if len(countries_filter) and \
           not len(countries_filter.intersection(dataset.countries)):
            continue
        for country in dataset.countries:
            countries_facet[country] += 1
        category_facet[dataset.category] += 1
        filtered.append(dataset)

    filtered = sorted(filtered, key=lambda d: d.entities_count, reverse=True)
    facets = {'countries': {'values': []}, 'category': {'values': []}}
    categories = get_config('COLLECTION_CATEGORIES', {})

    countries_facet = sorted(countries_facet.items(), key=lambda (k, c): c)
    for key, count in countries_facet[::-1]:
        facets['countries']['values'].append({
            'id': key,
            'count': count,
            'label': COUNTRY_NAMES.get(key, key)
        })

    category_facet = sorted(category_facet.items(), key=lambda (k, c): c)
    for key, count in category_facet[::-1]:
        if key is None:
            continue
        facets['category']['values'].append({
            'id': key,
            'count': count,
            'label': categories.get(key, key)
        })

    return jsonify({
        'results': filtered,
        'facets': facets,
        'total': len(filtered),
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
