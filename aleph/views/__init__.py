from colander import Invalid
from flask import request
from apikit import jsonify

from aleph.core import app, login_manager
from aleph.views.ui import ui # noqa
from aleph.assets import assets # noqa
from aleph.model import User
from aleph.views.document_api import blueprint as document_api
from aleph.views.search_api import blueprint as search_api
from aleph.views.graph_api import blueprint as graph_api
from aleph.views.sessions_api import blueprint as sessions_api
from aleph.views.users_api import blueprint as users_api
from aleph.views.watchlists_api import blueprint as watchlists_api
from aleph.views.entities_api import blueprint as entities_api
from aleph.views.exports_api import blueprint as exports_api
from aleph.views.sources_api import blueprint as sources_api
from aleph.views.crawlers_api import blueprint as crawlers_api


app.register_blueprint(document_api)
app.register_blueprint(search_api)
app.register_blueprint(graph_api)
app.register_blueprint(sessions_api)
app.register_blueprint(users_api)
app.register_blueprint(watchlists_api)
app.register_blueprint(entities_api)
app.register_blueprint(exports_api)
app.register_blueprint(sources_api)
app.register_blueprint(crawlers_api)


@login_manager.request_loader
def load_user_from_request(request):
    api_key = request.headers.get('X-API-Key') \
        or request.args.get('api_key')
    if api_key is not None:
        return User.by_api_key(api_key)


@app.before_request
def before():
    request._authz_sources = {}
    request._authz_watchlists = {}


@app.errorhandler(Invalid)
def handle_invalid(exc):
    exc.node.name = ''
    data = {
        'status': 400,
        'errors': exc.asdict()
    }
    return jsonify(data, status=400)
