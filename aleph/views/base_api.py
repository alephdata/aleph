import six
import logging
from flask import Blueprint, request
from elasticsearch import TransportError
from exactitude import countries, languages
from followthemoney import model
from followthemoney.exc import InvalidData

from aleph.core import settings, app_ui_url, url_for
from aleph.logic.statistics import get_instance_stats
from aleph.model import Collection
from aleph.views.cache import enable_cache
from aleph.views.util import jsonify

blueprint = Blueprint('base_api', __name__)
log = logging.getLogger(__name__)


@blueprint.route('/api/2/metadata')
def metadata():
    enable_cache(vary_user=False)

    auth = {}
    if settings.PASSWORD_LOGIN:
        auth['password_login_uri'] = url_for('sessions_api.password_login')
        auth['registration_uri'] = url_for('roles_api.create_code')
    if settings.OAUTH:
        auth['oauth_uri'] = url_for('sessions_api.oauth_init')

    return jsonify({
        'status': 'ok',
        'maintenance': request.authz.in_maintenance,
        'app': {
            'title': settings.APP_TITLE,
            'ui_uri': six.text_type(app_ui_url),
            'samples': settings.SAMPLE_SEARCHES
        },
        'categories': Collection.CATEGORIES,
        'countries': countries.names,
        'languages': languages.names,
        'schemata': model,
        'auth': auth
    })


@blueprint.route('/api/2/statistics')
def statistics():
    enable_cache()
    return jsonify(get_instance_stats(request.authz))


@blueprint.route('/api/1/<path:path>')
def api_v1_message(path):
    return jsonify({
        'status': 'error',
        'message': '/api/1/ is deprecated, please use /api/2/.'
    }, status=501)


@blueprint.app_errorhandler(403)
def handle_authz_error(err):
    return jsonify({
        'status': 'error',
        'message': 'You are not authorized to do this.',
        'roles': request.authz.roles
    }, status=403)


@blueprint.app_errorhandler(404)
def handle_not_found_error(err):
    return jsonify({
        'status': 'error',
        'message': 'This path does not exist.'
    }, status=404)


@blueprint.app_errorhandler(InvalidData)
def handle_invalid_data(err):
    return jsonify({
        'status': 'error',
        'errors': err.errors
    }, status=400)


@blueprint.app_errorhandler(TransportError)
def handle_es_error(err):
    message = err.error
    try:
        status = int(err.status_code)
    except Exception:
        status = 500
    try:
        for cause in err.info.get('error', {}).get('root_cause', []):
            message = cause.get('reason', message)
    except Exception as ex:
        log.debug(ex)
    return jsonify({
        'status': 'error',
        'message': message
    }, status=status)
