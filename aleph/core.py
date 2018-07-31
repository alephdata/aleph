import logging
from banal import ensure_list
from urllib.parse import urlparse, urljoin
from werkzeug.local import LocalProxy
from flask import Flask, request
from flask import url_for as flask_url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_cors import CORS
from flask_caching import Cache
from flask.ext.babel import Babel
from kombu import Queue
from celery import Celery
from celery.schedules import crontab
from followthemoney import set_model_locale
from raven.contrib.flask import Sentry
from raven.contrib.celery import register_signal, register_logger_signal
from elasticsearch import Elasticsearch
from urlnormalizer import query_string
import storagelayer

from aleph import settings
from aleph.util import SessionTask, get_extensions
from aleph.oauth import configure_oauth

log = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
celery = Celery('aleph', task_cls=SessionTask)
sentry = Sentry()
babel = Babel()
cache = Cache()


def create_app(config={}):
    app = Flask('aleph')
    app.config.from_object(settings)
    app.config.update(config)

    if 'postgres' not in settings.DATABASE_URI:
        raise RuntimeError("aleph database must be PostgreSQL!")

    app.config.update({
        'SQLALCHEMY_DATABASE_URI': settings.DATABASE_URI,
        'BABEL_DOMAIN': 'aleph'
    })

    queue = Queue(settings.QUEUE_NAME,
                  routing_key=settings.QUEUE_ROUTING_KEY,
                  queue_arguments={'x-max-priority': 9})
    celery.conf.update(
        imports=('aleph.queues'),
        broker_url=settings.BROKER_URI,
        task_always_eager=settings.EAGER,
        task_eager_propagates=True,
        task_ignore_result=True,
        task_acks_late=True,
        task_queues=(queue,),
        task_default_queue=settings.QUEUE_NAME,
        task_default_routing_key=settings.QUEUE_ROUTING_KEY,
        worker_max_tasks_per_child=500,
        result_persistent=False,
        beat_schedule={
            'hourly': {
                'task': 'aleph.logic.scheduled.hourly',
                'schedule': crontab(hour='*', minute=0)
            },
            'daily': {
                'task': 'aleph.logic.scheduled.daily',
                'schedule': crontab(hour=5, minute=0)
            }
        },
    )

    migrate.init_app(app, db, directory=settings.ALEMBIC_DIR)
    configure_oauth(app)
    mail.init_app(app)
    db.init_app(app)
    babel.init_app(app)
    cache.init_app(app, config={'CACHE_TYPE': 'simple'})
    CORS(app, origins=settings.CORS_ORIGINS)

    # Enable raven to submit issues to sentry if a DSN is defined. This will
    # report errors from Flask and Celery operation modes to Sentry.
    if settings.SENTRY_DSN:
        sentry.init_app(app,
                        dsn=settings.SENTRY_DSN,
                        logging=True,
                        level=logging.ERROR)
        register_logger_signal(sentry.client)
        register_signal(sentry.client, ignore_expected=True)

    # This executes all registered init-time plugins so that other
    # applications can register their behaviour.
    for plugin in get_extensions('aleph.init'):
        plugin(app=app)
    return app


@babel.localeselector
def determine_locale():
    try:
        options = settings.UI_LANGUAGES
        locale = request.accept_languages.best_match(options)
        locale = locale or str(babel.default_locale)
    except RuntimeError:
        locale = str(babel.default_locale)
    set_model_locale(locale)
    return locale


@migrate.configure
def configure_alembic(config):
    config.set_main_option('sqlalchemy.url', settings.DATABASE_URI)
    return config


def get_es():
    if not hasattr(settings, '_es_instance'):
        url = settings.ELASTICSEARCH_URL
        timeout = settings.ELASTICSEARCH_TIMEOUT
        settings._es_instance = Elasticsearch(url, timeout=timeout)
    return settings._es_instance


def get_archive():
    if not hasattr(settings, '_aleph_archive'):
        archive = storagelayer.init(settings.ARCHIVE_TYPE,
                                    path=settings.ARCHIVE_PATH,
                                    aws_key_id=settings.ARCHIVE_AWS_KEY_ID,  # noqa
                                    aws_secret=settings.ARCHIVE_AWS_SECRET,  # noqa
                                    aws_region=settings.ARCHIVE_AWS_REGION,  # noqa
                                    bucket=settings.ARCHIVE_BUCKET)  # noqa
        settings._aleph_archive = archive
    return settings._aleph_archive


es = LocalProxy(get_es)
archive = LocalProxy(get_archive)


def url_for(*a, **kw):
    """Overwrite Flask url_for to force external paths."""
    try:
        kw['_external'] = False
        query = kw.pop('_query', None)
        authorize = kw.pop('_authorize', False)
        path = flask_url_for(*a, **kw)
        if authorize is True:
            token = request.authz.to_token(scope=path)
            query = list(ensure_list(query))
            query.append(('api_key', token))
        return url_external(path, query)
    except RuntimeError:
        return None


def url_external(path, query):
    """Generate external URLs with HTTPS (if configured)."""
    try:
        api_url = request.url_root
        if settings.URL_SCHEME is not None:
            parsed = urlparse(api_url)
            parsed = parsed._replace(scheme=settings.URL_SCHEME)
            api_url = parsed.geturl()

        if query is not None:
            path = path + query_string(query)
        return urljoin(api_url, path)
    except RuntimeError:
        return None
