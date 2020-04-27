import logging
from babel import Locale
from collections import defaultdict
from flask import Blueprint, request, current_app
from flask_babel import gettext, get_locale
from elasticsearch import TransportError
from followthemoney import model
from followthemoney.exc import InvalidData
from jwt import ExpiredSignatureError, DecodeError

from aleph import __version__
from aleph.core import cache, settings, url_for
from aleph.model import Collection
from aleph.logic import resolver
from aleph.validation import get_openapi_spec
from aleph.views.context import enable_cache, NotModified
from aleph.views.util import jsonify

blueprint = Blueprint('base_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/metadata')
def metadata():
    """Get operational metadata for the frontend.
    ---
    get:
      summary: Retrieve system metadata from the application.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
      tags:
      - System
    """
    locale = get_locale()
    enable_cache(vary_user=False, vary=str(locale))
    key = cache.key('metadata', settings.PROCESS_ID, locale)
    data = cache.get_complex(key)
    if data is not None:
        return jsonify(data)

    auth = {}
    if settings.PASSWORD_LOGIN:
        auth['password_login_uri'] = url_for('sessions_api.password_login')
        auth['registration_uri'] = url_for('roles_api.create_code')
    if settings.OAUTH:
        auth['oauth_uri'] = url_for('sessions_api.oauth_init')

    locales = settings.UI_LANGUAGES
    locales = {l: Locale(l).get_language_name(l) for l in locales}
    blob = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1IjozLCJleHAiOjE1ODc3NTg2NzMsInIiOlsxLDIsM10sImEiOnRydWUsInJvbGUiOnsiaWQiOiIzIiwidHlwZSI6InVzZXIiLCJuYW1lIjoiZm9vIiwibGFiZWwiOiJmb28gPGYqKkBmb28uZm9vPiIsImVtYWlsIjoiZm9vQGZvby5mb28iLCJsb2NhbGUiOm51bGwsImFwaV9rZXkiOiI5NjNkY2M0MzZiOGQ0NDM1YmEyY2E2MWY5MjNiNzZkNSIsImlzX2FkbWluIjp0cnVlLCJpc19tdXRlZCI6ZmFsc2UsImlzX3Rlc3RlciI6ZmFsc2UsImhhc19wYXNzd29yZCI6dHJ1ZX19.H7QF5vW1oQLAlbMw5ghtjZ9nQ4-vwHLcngKwJHoWj0Y"

    data = {
        'token' : blob,
        'status': 'ok',
        'maintenance': request.authz.in_maintenance,
        'app': {
            'title': settings.APP_TITLE,
            'description': settings.APP_DESCRIPTION,
            'version': __version__,
            'banner': settings.APP_BANNER,
            'ui_uri': settings.APP_UI_URL,
            'samples': settings.SAMPLE_SEARCHES,
            'logo': settings.APP_LOGO,
            'favicon': settings.APP_FAVICON,
            'locale': str(locale),
            'locales': locales
        },
        'categories': Collection.CATEGORIES,
        'model': model,
        'auth': auth
    }
    cache.set_complex(key, data, expires=120)
    return jsonify(data)


@blueprint.route('/api/openapi.json')
def openapi():
    """Generate an OpenAPI 3.0 documentation JSON file for the API."""
    spec = get_openapi_spec(current_app)
    for name, view in current_app.view_functions.items():
        if name in ('static', 'base_api.openapi',
                    'base_api.api_v1_message',
                    'sessions_api.oauth_callback'):
            continue
        log.info('%s - %s', name, view.__qualname__)
        spec.path(view=view)
    return jsonify(spec.to_dict())


@blueprint.route('/api/2/statistics')
def statistics():
    """Get a summary of the data acessible to the current user.
    ---
    get:
      summary: System-wide user statistics.
      description: >
        Get a summary of the data acessible to the current user.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
      tags:
      - System
    """
    enable_cache()
    collections = request.authz.collections(request.authz.READ)
    for collection_id in collections:
        resolver.queue(request, Collection, collection_id)
    resolver.resolve(request)

    # Summarise stats. This is meant for display, so the counting is a bit
    # inconsistent between counting all collections, and source collections
    # only.
    schemata = defaultdict(int)
    countries = defaultdict(int)
    categories = defaultdict(int)
    for collection_id in collections:
        data = resolver.get(request, Collection, collection_id)
        if data is None or data.get('casefile'):
            continue
        categories[data.get('category')] += 1
        for schema, count in data.get('schemata', {}).items():
            schemata[schema] += count
        for country in data.get('countries', []):
            countries[country] += 1

    return jsonify({
        'collections': len(collections),
        'schemata': dict(schemata),
        'countries': dict(countries),
        'categories': dict(categories),
        'things': sum(schemata.values()),
    })


@blueprint.route('/healthz')
def healthz():
    """
    ---
    get:
      summary: Health check endpoint.
      description: >
        This can be used e.g. for Kubernetes health checks, but it doesn't
        do any internal checks.
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: 'ok'
      tags:
      - System
    """
    return jsonify({'status': 'ok'})


@blueprint.route('/api/1/<path:path>')
def api_v1_message(path):
    return jsonify({
        'status': 'error',
        'message': gettext('/api/1/ is deprecated, please use /api/2/.')
    }, status=410)


@blueprint.app_errorhandler(NotModified)
def handle_not_modified(err):
    return ('', 304)


@blueprint.app_errorhandler(400)
def handle_bad_request(err):
    if err.response is not None and err.response.is_json:
        return err.response
    return jsonify({
        'status': 'error',
        'message': err.description
    }, status=400)


@blueprint.app_errorhandler(403)
def handle_authz_error(err):
    return jsonify({
        'status': 'error',
        'message': gettext('You are not authorized to do this.'),
        'roles': request.authz.roles
    }, status=403)


@blueprint.app_errorhandler(404)
def handle_not_found_error(err):
    return jsonify({
        'status': 'error',
        'message': gettext('This path does not exist.')
    }, status=404)


@blueprint.app_errorhandler(500)
def handle_server_error(err):
    log.exception("%s: %s", type(err).__name__, err)
    return jsonify({
        'status': 'error',
        'message': gettext('Internal server error.')
    }, status=500)


@blueprint.app_errorhandler(InvalidData)
def handle_invalid_data(err):
    return jsonify({
        'status': 'error',
        'message': str(err),
        'errors': err.errors
    }, status=400)


@blueprint.app_errorhandler(DecodeError)
@blueprint.app_errorhandler(ExpiredSignatureError)
def handle_jwt_expired(err):
    return jsonify({
        'status': 'error',
        'errors': gettext('Access token is invalid.')
    }, status=401)


@blueprint.app_errorhandler(TransportError)
def handle_es_error(err):
    message = err.error
    if hasattr(err, 'info') and isinstance(err.info, dict):
        error = err.info.get('error', {})
        for root_cause in error.get('root_cause', []):
            message = root_cause.get('reason', message)
    return jsonify({
        'status': 'error',
        'message': message
    }, status=err.status_code)
