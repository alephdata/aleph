from werkzeug.exceptions import Unauthorized
from flask import request

from aleph.views.context import blueprint as cache
from aleph.views.base_api import blueprint as base_api
from aleph.views.sessions_api import blueprint as sessions_api
from aleph.views.roles_api import blueprint as roles_api
from aleph.views.groups_api import blueprint as groups_api
from aleph.views.permissions_api import blueprint as permissions_api
from aleph.views.collections_api import blueprint as collections_api
from aleph.views.entities_api import blueprint as entities_api
from aleph.views.profiles_api import blueprint as profiles_api
from aleph.views.alerts_api import blueprint as alerts_api
from aleph.views.ingest_api import blueprint as ingest_api
from aleph.views.notifications_api import blueprint as notifications_api
from aleph.views.reconcile_api import blueprint as reconcile_api
from aleph.views.xref_api import blueprint as xref_api
from aleph.views.stream_api import blueprint as stream_api
from aleph.views.archive_api import blueprint as archive_api
from aleph.views.status_api import blueprint as status_api
from aleph.views.mappings_api import blueprint as mappings_api
from aleph.views.entitysets_api import blueprint as entitysets_api
from aleph.views.exports_api import blueprint as exports_api

from aleph.core import settings
from aleph.views.util import get_authz


def require_auth():
    authz = get_authz(request)
    if authz is None:
        raise Unauthorized()


def register_blueprint(app, blueprint, **kw):
    if settings.REQUIRE_AUTH:
        # Raise 403 error for anonymous requests for all endpoints other than
        # the base api endpoints (metadata, statistics, health checks etc) and
        # authentication endpoints
        if blueprint.name not in (base_api.name, sessions_api.name):
            blueprint.before_request(require_auth)
    app.register_blueprint(blueprint, **kw)


def mount_app_blueprints(app):
    register_blueprint(app, cache)
    register_blueprint(app, base_api)
    register_blueprint(app, sessions_api)
    register_blueprint(app, roles_api)
    register_blueprint(app, groups_api)
    register_blueprint(app, permissions_api, url_prefix="/api/2/collections")
    register_blueprint(app, collections_api, url_prefix="/api/2/collections")
    register_blueprint(app, entities_api)
    register_blueprint(app, profiles_api)
    register_blueprint(app, alerts_api)
    register_blueprint(app, ingest_api, url_prefix="/api/2/collections")
    register_blueprint(app, reconcile_api)
    register_blueprint(app, notifications_api)
    register_blueprint(app, xref_api)
    register_blueprint(app, stream_api)
    register_blueprint(app, archive_api)
    register_blueprint(app, status_api)
    register_blueprint(app, mappings_api, url_prefix="/api/2/collections")
    register_blueprint(app, entitysets_api)
    register_blueprint(app, exports_api)
