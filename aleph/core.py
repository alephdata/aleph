import os
import logging
from logging.handlers import SMTPHandler
from urlparse import urljoin
from flask import Flask, current_app
from flask import url_for as flask_url_for
from flask_sqlalchemy import SQLAlchemy
from flask_assets import Environment
from flask_migrate import Migrate
from flask_oauthlib.client import OAuth
from flask_mail import Mail
from kombu import Queue
from celery import Celery
from py2neo import Graph
from elasticsearch import Elasticsearch

from aleph import default_settings, archive
from aleph.ext import get_init

log = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
assets = Environment()
oauth = OAuth()
oauth_provider = oauth.remote_app('provider', app_key='OAUTH')

# these two queues are used so that background processing tasks
# spawned by the user can be handled more quickly through a
# separate worker daemon and don't get boxed in behind very
# large bulk imports. see: https://github.com/pudo/aleph/issues/44
USER_QUEUE = 'user'
USER_ROUTING_KEY = 'user.process'
WORKER_QUEUE = 'worker'
WORKER_ROUTING_KEY = 'worker.process'
CELERYD_MAX_TASKS_PER_CHILD = int(os.environ.get('CELERYD_MAX_TASKS_PER_CHILD', '10'))

def create_app(config={}):
    app = Flask('aleph')
    app.config.from_object(default_settings)
    if config.get('TESTING'):
        app.config.from_envvar('ALEPH_TEST_SETTINGS', silent=True)
    else:
        app.config.from_envvar('ALEPH_SETTINGS', silent=True)
    app.config.update(config)
    app_name = app.config.get('APP_NAME')

    if not app.debug and app.config.get('MAIL_ADMINS'):
        credentials = (app.config.get('MAIL_USERNAME'),
                       app.config.get('MAIL_PASSWORD'))
        mail_handler = SMTPHandler(app.config.get('MAIL_SERVER'),
                                   app.config.get('MAIL_FROM'),
                                   app.config.get('MAIL_ADMINS'),
                                   '[%s] Crash report' % app_name,
                                   credentials=credentials,
                                   secure=())
        mail_handler.setLevel(logging.ERROR)
        app.logger.addHandler(mail_handler)

    if 'postgres' not in app.config.get('SQLALCHEMY_DATABASE_URI', ''):
        raise RuntimeError("aleph database must be PostgreSQL!")

    app.config['CELERY_DEFAULT_QUEUE'] = WORKER_QUEUE
    app.config['CELERY_DEFAULT_ROUTING_KEY'] = WORKER_ROUTING_KEY
    app.config['CELERYD_MAX_TASKS_PER_CHILD'] = CELERYD_MAX_TASKS_PER_CHILD

    app.config['CELERY_QUEUES'] = (
        Queue(WORKER_QUEUE, routing_key=WORKER_ROUTING_KEY),
        Queue(USER_QUEUE, routing_key=USER_ROUTING_KEY),
    )

    migrate.init_app(app, db, directory=app.config.get('ALEMBIC_DIR'))
    oauth.init_app(app)
    mail.init_app(app)
    db.init_app(app)
    assets.init_app(app)

    # This executes all registered init-time plugins so that other
    # applications can register their behaviour.
    for plugin in get_init():
        plugin(app=app)

    return app


def make_celery(flask_app):
    celery = Celery('aleph', broker=flask_app.config['CELERY_BROKER_URL'])
    celery.conf.update(flask_app.config)
    celery.conf.update({
        'BROKER_URL': flask_app.config['CELERY_BROKER_URL']
    })
    TaskBase = celery.Task

    class ContextTask(TaskBase):
        abstract = True

        def __call__(self, *args, **kwargs):
            with flask_app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)
    celery.Task = ContextTask
    return celery


@migrate.configure
def configure_alembic(config):
    app = current_app._get_current_object()
    config.set_main_option('sqlalchemy.url',
                           app.config['SQLALCHEMY_DATABASE_URI'])
    return config


def get_config(name, default=None):
    return current_app.config.get(name, default)


def get_app_url():
    return urljoin(current_app.config.get('APP_BASEURL'), '/')


def get_app_name():
    return current_app.config.get('APP_NAME', 'aleph')


def get_app_title():
    return current_app.config.get('APP_TITLE') or get_app_name()


def get_es():
    app = current_app._get_current_object()
    if not hasattr(app, '_es_instance'):
        app._es_instance = Elasticsearch(app.config.get('ELASTICSEARCH_URL'),
                                         timeout=120)
    return app._es_instance


def get_es_index():
    app = current_app._get_current_object()
    return app.config.get('ELASTICSEARCH_INDEX', app.config.get('APP_NAME'))


def get_archive():
    app = current_app._get_current_object()
    if not hasattr(app, '_aleph_archive'):
        app._aleph_archive = archive.from_config(app.config)
    return app._aleph_archive


def get_graph():
    app = current_app._get_current_object()
    if not hasattr(app, '_neo4j_instance'):
        uri = get_config('NEO4J_URI')
        if uri is None:
            return None
        try:
            app._neo4j_instance = Graph(uri)
            log.info("Connected to graph: %s", app._neo4j_instance)
        except Exception as ex:
            log.info("Could not connect to graph: %r", ex)
            return None
    return app._neo4j_instance


def get_upload_folder():
    folder = current_app.config.get('UPLOAD_FOLDER')
    try:
        os.makedirs(folder)
    except:
        pass
    return folder


def url_for(*a, **kw):
    """Generate external URLs with HTTPS (if configured)."""
    try:
        kw['_external'] = True
        if get_config('PREFERRED_URL_SCHEME'):
            kw['_scheme'] = get_config('PREFERRED_URL_SCHEME')
        return flask_url_for(*a, **kw)
    except RuntimeError:
        return None

celery = make_celery(create_app())
