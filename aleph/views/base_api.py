import os
import logging
from time import time
from apikit import jsonify
from flask import render_template, current_app, Blueprint, request
from jsonschema import ValidationError
from elasticsearch import TransportError

from aleph.core import get_config
from aleph.model.constants import CORE_FACETS, SOURCE_CATEGORIES
from aleph.model.constants import COUNTRY_NAMES, LANGUAGE_NAMES
from aleph.model.validation import resolver
from aleph.views.cache import enable_cache

blueprint = Blueprint('base_api', __name__)
log = logging.getLogger(__name__)


def angular_templates():
    templates = {}
    template_dirs = [current_app.static_folder]
    template_dirs.extend(get_config('CUSTOM_TEMPLATES_DIR'))
    for template_dir in template_dirs:
        for tmpl_set in ['templates', 'help']:
            tmpl_dir = os.path.join(template_dir, tmpl_set)
            for (root, dirs, files) in os.walk(tmpl_dir):
                for file_name in files:
                    file_path = os.path.join(root, file_name)
                    with open(file_path, 'rb') as fh:
                        file_name = file_path[len(template_dir) + 1:]
                        templates[file_name] = fh.read().decode('utf-8')
    return templates.items()


@blueprint.route('/search')
@blueprint.route('/help')
@blueprint.route('/help/<path:path>')
@blueprint.route('/entities')
@blueprint.route('/entities/<path:path>')
@blueprint.route('/crawlers')
@blueprint.route('/crawlers/logs')
@blueprint.route('/tabular/<path:path>')
@blueprint.route('/text/<path:path>')
@blueprint.route('/')
def ui(**kwargs):
    enable_cache(server_side=True)
    return render_template("layout.html", templates=angular_templates())


@blueprint.route('/api/1/metadata')
def metadata():
    enable_cache(server_side=False)
    schemata = {}
    for schema_id, schema in resolver.store.items():
        if not schema_id.endswith('#'):
            schema_id = schema_id + '#'
        schemata[schema_id] = {
            'id': schema_id,
            'title': schema.get('title'),
            'faIcon': schema.get('faIcon'),
            'plural': schema.get('plural', schema.get('title')),
            'description': schema.get('description'),
            'inline': schema.get('inline', False)
        }
    return jsonify({
        'status': 'ok',
        'fields': CORE_FACETS,
        'source_categories': SOURCE_CATEGORIES,
        'countries': COUNTRY_NAMES,
        'languages': LANGUAGE_NAMES,
        'schemata': schemata
    })


@blueprint.app_errorhandler(403)
def handle_authz_error(err):
    return jsonify({
        'status': 'error',
        'message': 'You are not authorized to do this.',
        'roles': request.auth_roles,
        'user': request.auth_role
    }, status=403)


@blueprint.app_errorhandler(ValidationError)
def handle_validation_error(err):
    return jsonify({
        'status': 'error',
        'message': err.message
    }, status=400)


@blueprint.app_errorhandler(TransportError)
def handle_es_error(err):
    return jsonify({
        'status': 'error',
        'message': err.error,
        'info': err.info.get('error', {}).get('root_cause', [])[-1]
    }, status=400)
