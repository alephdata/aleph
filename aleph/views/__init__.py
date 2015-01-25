from aleph.core import app

from aleph.views.ui import ui # noqa
from aleph.assets import assets # noqa
from aleph.views.data_api import blueprint as data_api


app.register_blueprint(data_api)
