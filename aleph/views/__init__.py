from flask import request
from flask.ext.login import current_user

from aleph.core import app, login_manager
from aleph.views.ui import ui # noqa
from aleph.assets import assets # noqa
from aleph.model import User, Collection
from aleph.views.data_api import blueprint as data_api
from aleph.views.search_api import blueprint as search_api
from aleph.views.sessions_api import blueprint as sessions_api
from aleph.views.users_api import blueprint as users_api
from aleph.views.collections_api import blueprint as collections_api


app.register_blueprint(data_api)
app.register_blueprint(search_api)
app.register_blueprint(sessions_api)
app.register_blueprint(users_api)
app.register_blueprint(collections_api)


@login_manager.request_loader
def load_user_from_request(request):
    api_key = request.headers.get('X-API-Key') \
        or request.args.get('api_key')
    if api_key is not None:
        return User.by_api_key(api_key)


@app.before_request
def before():
    if request.endpoint != 'static':
        request.collection_slugs = Collection.list_user_slugs(current_user)
