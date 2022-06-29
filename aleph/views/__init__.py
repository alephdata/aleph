# SPDX-FileCopyrightText: 2014 2014 Emma Prest, <emma@occrp.org> et al.
#
# SPDX-License-Identifier: MIT

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


def mount_app_blueprints(app):
    app.register_blueprint(cache)
    app.register_blueprint(base_api)
    app.register_blueprint(sessions_api)
    app.register_blueprint(roles_api)
    app.register_blueprint(groups_api)
    app.register_blueprint(permissions_api, url_prefix="/api/2/collections")
    app.register_blueprint(collections_api, url_prefix="/api/2/collections")
    app.register_blueprint(entities_api)
    app.register_blueprint(profiles_api)
    app.register_blueprint(alerts_api)
    app.register_blueprint(ingest_api, url_prefix="/api/2/collections")
    app.register_blueprint(reconcile_api)
    app.register_blueprint(notifications_api)
    app.register_blueprint(xref_api)
    app.register_blueprint(stream_api)
    app.register_blueprint(archive_api)
    app.register_blueprint(status_api)
    app.register_blueprint(mappings_api, url_prefix="/api/2/collections")
    app.register_blueprint(entitysets_api)
    app.register_blueprint(exports_api)
