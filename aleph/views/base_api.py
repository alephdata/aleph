import logging
from collections import defaultdict
from flask import Blueprint, request
from flask_babel import gettext, get_locale
from elasticsearch import TransportError
from followthemoney import model
from followthemoney.exc import InvalidData
from followthemoney.types import registry
from jwt import ExpiredSignatureError

from aleph import __version__
from aleph.core import cache, settings, url_for
from aleph.model import Collection, Role
from aleph.logic import resolver
from aleph.views.serializers import RoleSerializer
from aleph.views.cache import enable_cache, NotModified
from aleph.views.util import jsonify

blueprint = Blueprint('base_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/metadata')
def metadata():
    locale = get_locale()
    enable_cache(vary_user=False, vary=str(locale))
    key = cache.key('metadata', locale)
    data = cache.get_complex(key)
    if data is not None:
        return jsonify(data)

    auth = {}
    if settings.PASSWORD_LOGIN:
        auth['password_login_uri'] = url_for('sessions_api.password_login')
        auth['registration_uri'] = url_for('roles_api.create_code')
    if settings.OAUTH:
        auth['oauth_uri'] = url_for('sessions_api.oauth_init')

    data = {
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
            'locales': settings.UI_LANGUAGES
        },
        'categories': Collection.CATEGORIES,
        'countries': registry.country.names,
        'languages': registry.language.names,
        'model': model,
        'auth': auth
    }
    cache.set_complex(key, data, expire=120)
    return jsonify(data)


@blueprint.route('/api/2/statistics')
def statistics():
    """Get a summary of the data acessible to the current user."""
    enable_cache()
    collections = request.authz.collections(request.authz.READ)
    for collection_id in collections:
        resolver.queue(request, Collection, collection_id)
    for role_id in request.authz.roles:
        resolver.queue(request, Role, role_id)
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

    # Add a users roles to the home page:
    groups = []
    for role_id in request.authz.roles:
        data = resolver.get(request, Role, role_id)
        if data is None or data.get('type') != Role.GROUP:
            continue
        groups.append(RoleSerializer().serialize(data))

    return jsonify({
        'collections': len(collections),
        'schemata': dict(schemata),
        'countries': dict(countries),
        'categories': dict(categories),
        'groups': groups,
        'things': sum(schemata.values()),
    })


@blueprint.route('/healthz')
def healthz():
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


@blueprint.app_errorhandler(ExpiredSignatureError)
def handle_jwt_expired(err):
    return jsonify({
        'status': 'error',
        'errors': gettext('Access token has expired.')
    }, status=401)


@blueprint.app_errorhandler(TransportError)
def handle_es_error(err):
    log.error("ES [%s]: %r", err.error, err.info)
    return jsonify({
        'status': 'error',
        'message': gettext('There was an error during search'),
        'context': err.error
    }, status=500)
