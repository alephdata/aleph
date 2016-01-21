from babel import Locale
from flask import Blueprint, request
from apikit import jsonify
from apikit import get_limit, get_offset
from pycountry import countries

from aleph.model.metadata import CORE_FACETS
from aleph.views.cache import etag_cache_keygen
from aleph.search import construct_query, execute_query

blueprint = Blueprint('search', __name__)


@blueprint.route('/api/1/query')
def query():
    etag_cache_keygen()
    query = construct_query(request.args)
    query['size'] = get_limit(default=100)
    query['from'] = get_offset()
    return jsonify(execute_query(request.args, query))


@blueprint.route('/api/1/metadata')
def metadata():
    etag_cache_keygen()

    country_names = {
        'zz': 'Global',
        'xk': 'Kosovo'
    }

    for country in countries:
        country_names[country.alpha2.lower()] = country.name

    language_names = dict(Locale('en').languages.items())
    language_names = {k: v for k, v in language_names.items() if len(k) == 2}

    return jsonify({
        'status': 'ok',
        'fields': CORE_FACETS,
        'countries': country_names,
        'languages': language_names
    })
