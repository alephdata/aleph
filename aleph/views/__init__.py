from colander import Invalid
from apikit import jsonify

from aleph.core import app
from aleph.views.ui import ui # noqa
from aleph.assets import assets # noqa
from aleph.views.document_api import blueprint as document_api
from aleph.views.search_api import blueprint as search_api
from aleph.views.graph_api import blueprint as graph_api
from aleph.views.sessions_api import blueprint as sessions_api
from aleph.views.roles_api import blueprint as roles_api
from aleph.views.table_api import blueprint as table_api
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
app.register_blueprint(table_api)
app.register_blueprint(watchlists_api)
app.register_blueprint(entities_api)
app.register_blueprint(exports_api)
app.register_blueprint(sources_api)
app.register_blueprint(alerts_api)


@app.errorhandler(Invalid)
def handle_invalid(exc):
    exc.node.name = ''
    data = {
        'status': 400,
        'errors': exc.asdict()
    }
    return jsonify(data, status=400)
