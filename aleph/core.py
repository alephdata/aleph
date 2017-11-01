import os
import logging
from logging.handlers import SMTPHandler
from urlparse import urlparse, urljoin
from werkzeug.local import LocalProxy
from flask import Flask, current_app, request
from flask import url_for as flask_url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_simpleldap import LDAP, LDAPException
from flask_cors import CORS
from kombu import Queue
from celery import Celery
from elasticsearch import Elasticsearch
import storagelayer

from aleph import default_settings
from aleph.ext import get_init
from aleph.util import SessionTask
from aleph.oauth import configure_oauth

log = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
celery = Celery('aleph', task_cls=SessionTask)
ldap = LDAP()

# these two queues are used so that background processing tasks
# spawned by the user can be handled more quickly through a
# separate worker daemon and don't get boxed in behind very
# large bulk imports. see: https://github.com/alephdata/aleph/issues/44
USER_QUEUE = 'user'
USER_ROUTING_KEY = 'user.process'
WORKER_QUEUE = 'worker'
WORKER_ROUTING_KEY = 'worker.process'


def create_app(config={}):
    app = Flask('aleph')
    app.config.from_object(default_settings)
    app.config.from_envvar('ALEPH_SETTINGS', silent=True)
    app.config.update(config)
    app_name = app.config.get('APP_NAME')

    if app.config.get("TESTING"):
        # The testing configuration is inferred from the production
        # settings, but it can only be derived after the config files
        # have actually been evaluated.
        database_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
        app.config['SQLALCHEMY_DATABASE_URI'] = database_uri + '_test'

        es_index = app.config.get('ELASTICSEARCH_INDEX',
                                  app.config.get('APP_NAME'))
        app.config['ELASTICSEARCH_INDEX'] = es_index + '_test'

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

    queues = (
        Queue(WORKER_QUEUE, routing_key=WORKER_ROUTING_KEY),
        Queue(USER_QUEUE, routing_key=USER_ROUTING_KEY),
    )
    celery.conf.update(
        imports=('aleph.queues'),
        broker_url=app.config['CELERY_BROKER_URL'],
        task_always_eager=app.config['CELERY_ALWAYS_EAGER'],
        task_eager_propagates=True,
        task_ignore_result=True,
        result_persistent=False,
        task_queues=queues,
        task_default_queue=WORKER_QUEUE,
        task_default_routing_key=WORKER_ROUTING_KEY,
        # ultra-high time limit to shoot hung tasks:
        task_time_limit=3600 * 3,
        worker_max_tasks_per_child=500,
        worker_disable_rate_limits=True,
        # worker_hijack_root_logger=False,
        beat_schedule=app.config['CELERYBEAT_SCHEDULE'],
    )
    celery.conf.update(app.config.get('CELERY', {}))

    migrate.init_app(app, db, directory=app.config.get('ALEMBIC_DIR'))
    configure_oauth(app)
    mail.init_app(app)
    db.init_app(app)
    CORS(app, origins=app.config.get('CORS_ORIGINS', []))

    try:
        ldap.init_app(app)
    except LDAPException as error:
        log.info(error)

    # This executes all registered init-time plugins so that other
    # applications can register their behaviour.
    for plugin in get_init():
        plugin(app=app)
    return app


@migrate.configure
def configure_alembic(config):
    app = current_app._get_current_object()
    config.set_main_option('sqlalchemy.url',
                           app.config['SQLALCHEMY_DATABASE_URI'])
    return config


def get_config(name, default=None):
    return current_app.config.get(name, default)


def get_app_ui_url():
    return current_app.config.get('APP_UI_URL')


def get_app_name():
    return current_app.config.get('APP_NAME', 'aleph')


def get_app_title():
    return current_app.config.get('APP_TITLE') or get_app_name()


def get_app_secret_key():
    return current_app.config.get('SECRET_KEY')


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
        archive = storagelayer.init(app.config.get('ARCHIVE_TYPE'),
                                    path=app.config.get('ARCHIVE_PATH'),
                                    aws_key_id=app.config.get('ARCHIVE_AWS_KEY_ID'),  # noqa
                                    aws_secret=app.config.get('ARCHIVE_AWS_SECRET'),  # noqa
                                    aws_region=app.config.get('ARCHIVE_AWS_REGION'),  # noqa
                                    bucket=app.config.get('ARCHIVE_BUCKET'))  # noqa
        app._aleph_archive = archive
    return app._aleph_archive


def get_language_whitelist():
    return [c.lower().strip() for c in get_config('LANGUAGES')]


app_name = LocalProxy(get_app_name)
app_title = LocalProxy(get_app_title)
app_ui_url = LocalProxy(get_app_ui_url)
es = LocalProxy(get_es)
es_index = LocalProxy(get_es_index)
archive = LocalProxy(get_archive)
secret_key = LocalProxy(get_app_secret_key)
language_whitelist = LocalProxy(get_language_whitelist)


def url_for(*a, **kw):
    """Generate external URLs with HTTPS (if configured)."""
    try:
        api_url = get_config('APP_API_URL')
        if api_url is None:
            api_url = request.url_root

        scheme = get_config('PREFERRED_URL_SCHEME')
        if scheme is not None:
            parsed = urlparse(api_url)
            parsed = parsed._replace(scheme=scheme)
            api_url = parsed.geturl()

        kw['_external'] = False
        path = flask_url_for(*a, **kw)
        return urljoin(api_url, path)
    except RuntimeError:
        return None
