from babel import Locale
from flask import Blueprint, request
from apikit import jsonify
from apikit import get_limit, get_offset
from pycountry import countries

from aleph.model.metadata import CORE_FACETS
from aleph.views.cache import etag_cache_keygen
from aleph.search import documents_query, execute_documents_query
from aleph.search import records_query, execute_records_query
from aleph.views.document_api import get_document

blueprint = Blueprint('search', __name__)


@blueprint.route('/api/1/query')
def query():
    etag_cache_keygen()
    query = documents_query(request.args)
    query['size'] = get_limit(default=100)
    query['from'] = get_offset()
    return jsonify(execute_documents_query(request.args, query))


@blueprint.route('/api/1/query/records/<int:document_id>')
def records(document_id):
    etag_cache_keygen()
    document = get_document(document_id)
    query = records_query(document.id, request.args)
    if query is None:
        return jsonify({
            'status': 'ok',
            'message': 'no query'
        })
    query['size'] = get_limit(default=100)
    query['from'] = get_offset()
    res = execute_records_query(document.id, request.args, query)
    return jsonify(res)


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
