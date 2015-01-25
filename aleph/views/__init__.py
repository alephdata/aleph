from aleph.core import app

from aleph.views.ui import ui # noqa
from aleph.assets import assets # noqa
from aleph.views.data_api import blueprint as data_api
from aleph.views.search_api import blueprint as search_api
from aleph.views.sessions_api import blueprint as sessions_api
from aleph.views.users_api import blueprint as users_api


app.register_blueprint(data_api)
app.register_blueprint(search_api)
app.register_blueprint(sessions_api)
app.register_blueprint(users_api)
