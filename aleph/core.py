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
from flask_babel import Babel
from kombu import Queue
from celery import Celery, Task
from celery.schedules import crontab
from balkhash import init as init_balkhash
from followthemoney import set_model_locale
from elasticsearch import Elasticsearch
from urlnormalizer import query_string
from servicelayer.cache import get_redis
from servicelayer.archive import init_archive
from servicelayer.extensions import get_extensions

from aleph import settings, signals
from aleph.cache import Cache
from aleph.oauth import configure_oauth

log = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()


class SessionTask(Task):

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        db.session.remove()


celery = Celery('aleph', task_cls=SessionTask)
babel = Babel()


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
        worker_max_tasks_per_child=1000,
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
    CORS(app, origins=settings.CORS_ORIGINS)

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


def has_google_credentials():
    """Check if a Google credentials JSON is available."""
    try:
        import google.auth
        google.auth.default()
        return True
    except Exception:
        return False


@signals.handle_request_log.connect
def stackdriver_log(sender, payload={}):
    from google.cloud import logging
    if not has_google_credentials():
        return
    if not hasattr(settings, '_gcp_logger'):
        client = logging.Client()
        settings._gcp_logger = client.logger('%s-requests' % settings.APP_NAME)
        log.debug("Enabling GCP Stackdriver request logging...")
    settings._gcp_logger.log_struct(payload)


@migrate.configure
def configure_alembic(config):
    config.set_main_option('sqlalchemy.url', settings.DATABASE_URI)
    return config


def get_es():
    if not hasattr(settings, '_es_instance'):
        es = Elasticsearch(settings.ELASTICSEARCH_URL,
                           timeout=settings.ELASTICSEARCH_TIMEOUT)
        settings._es_instance = es
    return settings._es_instance


def get_archive():
    if not hasattr(settings, '_aleph_archive'):
        settings._aleph_archive = init_archive(archive_type=settings.ARCHIVE_TYPE,  # noqa
                                               bucket=settings.ARCHIVE_BUCKET,
                                               path=settings.ARCHIVE_PATH)
    return settings._aleph_archive


def get_cache():
    if not hasattr(settings, '_cache') or settings._cache is None:
        settings._cache = Cache(get_redis(), prefix=settings.APP_NAME)
    return settings._cache


def get_dataset(dataset):
    """Connect to a balkhash dataset."""
    return init_balkhash(dataset)


es = LocalProxy(get_es)
kv = LocalProxy(get_redis)
cache = LocalProxy(get_cache)
archive = LocalProxy(get_archive)


def url_for(*a, **kw):
    """Overwrite Flask url_for to force external paths."""
    try:
        kw['_external'] = False
        query = kw.pop('_query', None)
        authorize = kw.pop('_authorize', False)
        relative = kw.pop('_relative', False)
        path = flask_url_for(*a, **kw)
        if authorize is True and hasattr(request, 'authz'):
            token = request.authz.to_token(scope=path)
            query = list(ensure_list(query))
            query.append(('api_key', token))
        return url_external(path, query, relative=relative)
    except RuntimeError:
        return None


def url_external(path, query, relative=False):
    """Generate external URLs with HTTPS (if configured)."""
    try:
        if query is not None:
            path = path + query_string(query)
        if relative:
            return path

        # api_url = request.url_root
        api_url = settings.APP_UI_URL
        if settings.URL_SCHEME is not None:
            parsed = urlparse(api_url)
            parsed = parsed._replace(scheme=settings.URL_SCHEME)
            api_url = parsed.geturl()
        return urljoin(api_url, path)
    except RuntimeError:
        return None
