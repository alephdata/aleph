from aleph import signals
from aleph.views.base_api import blueprint as base_api
from aleph.views.cache import blueprint as cache_api
from aleph.views.documents_api import blueprint as documents_api
from aleph.views.search_api import blueprint as search_api
from aleph.views.sessions_api import blueprint as sessions_api
from aleph.views.roles_api import blueprint as roles_api
from aleph.views.collections_api import blueprint as collections_api
from aleph.views.entities_api import blueprint as entities_api
from aleph.views.exports_api import blueprint as exports_api
from aleph.views.alerts_api import blueprint as alerts_api
from aleph.views.leads_api import blueprint as leads_api
from aleph.views.crawlers_api import blueprint as crawlers_api
from aleph.views.ingest_api import blueprint as ingest_api
from aleph.views.reconcile_api import blueprint as reconcile_api
from aleph.views.datasets_api import blueprint as datasets_api


def mount_app_blueprints(app):
    app.register_blueprint(base_api)
    app.register_blueprint(cache_api)
    app.register_blueprint(documents_api)
    app.register_blueprint(search_api)
    app.register_blueprint(sessions_api)
    app.register_blueprint(roles_api)
    app.register_blueprint(collections_api)
    app.register_blueprint(entities_api)
    app.register_blueprint(exports_api)
    app.register_blueprint(alerts_api)
    app.register_blueprint(leads_api)
    app.register_blueprint(crawlers_api)
    app.register_blueprint(ingest_api)
    app.register_blueprint(reconcile_api)
    app.register_blueprint(datasets_api)
    signals.register_blueprints.send(app=app)
