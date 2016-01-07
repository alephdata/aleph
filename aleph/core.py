from flask import Flask
from flask import url_for as flask_url_for
from flask.ext.sqlalchemy import SQLAlchemy
from flask.ext.login import LoginManager
from flask.ext.assets import Environment
from flask.ext.migrate import Migrate
from flask.ext.oauth import OAuth
from kombu import Exchange, Queue
from celery import Celery
from elasticsearch import Elasticsearch

from aleph import default_settings, archive


app = Flask(__name__)
app.config.from_object(default_settings)
app.config.from_envvar('ALEPH_SETTINGS', silent=True)

app_name = app.config.get('APP_NAME')

db = SQLAlchemy(app)
migrate = Migrate(app, db, directory=app.config.get('ALEMBIC_DIR'))

oauth = OAuth()
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'ui'

es = Elasticsearch(app.config.get('ELASTICSEARCH_URL'))
es_index = app.config.get('ELASTICSEARCH_INDEX', app_name)

queue_name = app_name + '_q'
app.config['CELERY_DEFAULT_QUEUE'] = queue_name
app.config['CELERY_QUEUES'] = (
    Queue(queue_name, Exchange(queue_name), routing_key=queue_name),
)

celery = Celery(app_name, broker=app.config['CELERY_BROKER_URL'])
celery.config_from_object(app.config)
assets = Environment(app)
archive = archive.from_config(app.config)


def url_for(*a, **kw):
    """ Always generate external URLs. """
    try:
        kw['_external'] = True
        if app.config.get('PREFERRED_URL_SCHEME'):
            kw['_scheme'] = app.config.get('PREFERRED_URL_SCHEME')
        return flask_url_for(*a, **kw)
    except RuntimeError:
        return None
