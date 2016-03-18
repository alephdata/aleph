from flask import request
from apikit import jsonify
from jsonschema import ValidationError

from aleph.core import app
from aleph.views.ui import ui  # noqa
from aleph.assets import assets  # noqa
from aleph.admin import admin  # noqa
from aleph.views.document_api import blueprint as document_api
from aleph.views.search_api import blueprint as search_api
from aleph.views.graph_api import blueprint as graph_api
from aleph.views.sessions_api import blueprint as sessions_api
from aleph.views.roles_api import blueprint as roles_api
from aleph.views.watchlists_api import blueprint as watchlists_api
from aleph.views.entities_api import blueprint as entities_api
from aleph.views.exports_api import blueprint as exports_api
from aleph.views.sources_api import blueprint as sources_api
from aleph.views.alerts_api import blueprint as alerts_api


app.register_blueprint(document_api)
app.register_blueprint(search_api)
app.register_blueprint(graph_api)
app.register_blueprint(sessions_api)
app.register_blueprint(roles_api)
app.register_blueprint(watchlists_api)
app.register_blueprint(entities_api)
app.register_blueprint(exports_api)
app.register_blueprint(sources_api)
app.register_blueprint(alerts_api)


@app.errorhandler(403)
def handle_authz_error(err):
    return jsonify({
        'status': 'error',
        'message': 'You are not authorized to do this.',
        'roles': request.auth_roles,
        'user': request.auth_user
    }, status=403)


@app.errorhandler(ValidationError)
def handle_validation_error(err):
    return jsonify({
        'status': 'error',
        'message': err.message
    }, status=400)
