from babel import Locale
from flask import Blueprint, request
from apikit import jsonify
from apikit import get_limit, get_offset
from pycountry import countries

from aleph import authz
from aleph.model.metadata import CORE_FACETS
from aleph.views.cache import enable_cache
from aleph.search import documents_query, execute_documents_query
from aleph.search import records_query, execute_records_query
from aleph.model import Alert
from aleph.views.document_api import get_document

blueprint = Blueprint('search', __name__)


@blueprint.route('/api/1/query')
def query():
    creds = authz.watchlists(authz.READ), authz.sources(authz.READ)
    enable_cache(vary_user=True, vary=creds)
    query = documents_query(request.args)
    query['size'] = get_limit(default=100)
    query['from'] = get_offset()
    result = execute_documents_query(request.args, query)
    result['alert'] = None
    if authz.logged_in():
        result['alert'] = Alert.exists(request.args, request.auth_role)
    return jsonify(result)


@blueprint.route('/api/1/query/records/<int:document_id>')
def records(document_id):
    document = get_document(document_id)
    enable_cache(vary_user=True)
    query = records_query(document.id, request.args)
    if query is None:
        return jsonify({
            'status': 'ok',
            'message': 'no query'
        })
    query['size'] = get_limit(default=30)
    query['from'] = get_offset()
    res = execute_records_query(document.id, request.args, query)
    return jsonify(res)


@blueprint.route('/api/1/metadata')
def metadata():
    enable_cache(server_side=False)
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
