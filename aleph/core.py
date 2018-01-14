import logging
# from logging.handlers import SMTPHandler
from urlparse import urlparse, urljoin
from werkzeug.local import LocalProxy
from flask import Flask, request
from flask import url_for as flask_url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_cors import CORS
from kombu import Queue
from celery import Celery
from celery.schedules import crontab
from raven.contrib.flask import Sentry
from raven.contrib.celery import register_signal, register_logger_signal
from elasticsearch import Elasticsearch
from urlnormalizer import query_string
import storagelayer

from aleph import settings
from aleph.ext import get_init
from aleph.util import SessionTask
from aleph.oauth import configure_oauth

log = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
celery = Celery('aleph', task_cls=SessionTask)
sentry = Sentry()

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
    app.config.from_object(settings)
    app.config.update(config)

    if 'postgres' not in settings.DATABASE_URI:
        raise RuntimeError("aleph database must be PostgreSQL!")

    app.config.update({
        'SQLALCHEMY_DATABASE_URI': settings.DATABASE_URI
    })

    # if settings.MAIL_SERVER and settings.ADMINS:
    #     credentials = (settings.MAIL_USERNAME,
    #                    settings.MAIL_PASSWORD)
    #     subject = '[%s] Crash report' % settings.APP_TITLE
    #     mail_handler = SMTPHandler(settings.MAIL_SERVER,
    #                                settings.MAIL_FROM,
    #                                settings.ADMINS,
    #                                subject,
    #                                credentials=credentials,
    #                                secure=())
    #     mail_handler.setLevel(logging.ERROR)
    #     app.logger.addHandler(mail_handler)

    queues = (
        Queue(WORKER_QUEUE, routing_key=WORKER_ROUTING_KEY),
        Queue(USER_QUEUE, routing_key=USER_ROUTING_KEY),
    )
    celery.conf.update(
        imports=('aleph.queues'),
        broker_url=settings.BROKER_URI,
        task_always_eager=settings.EAGER,
        task_eager_propagates=True,
        task_ignore_result=True,
        result_persistent=False,
        task_queues=queues,
        task_default_queue=WORKER_QUEUE,
        task_default_routing_key=WORKER_ROUTING_KEY,
        worker_max_tasks_per_child=500,
        worker_disable_rate_limits=True,
        beat_schedule={
            'alert-every-night': {
                'task': 'aleph.logic.alerts.check_alerts',
                'schedule': crontab(hour=1, minute=30)
            }
        },
    )

    migrate.init_app(app, db, directory=settings.ALEMBIC_DIR)
    configure_oauth(app)
    mail.init_app(app)
    db.init_app(app)
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
    for plugin in get_init():
        plugin(app=app)
    return app


@migrate.configure
def configure_alembic(config):
    config.set_main_option('sqlalchemy.url', settings.DATABASE_URI)
    return config


def get_app_ui_url():
    return settings.APP_UI_URL


def get_es():
    if not hasattr(settings, '_es_instance'):
        url = settings.ELASTICSEARCH_URL
        settings._es_instance = Elasticsearch(url, timeout=120)
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


def get_language_whitelist():
    return [c.lower().strip() for c in settings.LANGUAGES]


app_ui_url = LocalProxy(get_app_ui_url)
es = LocalProxy(get_es)
archive = LocalProxy(get_archive)
language_whitelist = LocalProxy(get_language_whitelist)


def url_for(*a, **kw):
    """Generate external URLs with HTTPS (if configured)."""
    try:
        api_url = request.url_root

        if settings.URL_SCHEME is not None:
            parsed = urlparse(api_url)
            parsed = parsed._replace(scheme=settings.URL_SCHEME)
            api_url = parsed.geturl()

        kw['_external'] = False
        query = kw.pop('_query', None)
        path = flask_url_for(*a, **kw)
        if query is not None:
            path = path + query_string(query)
        return urljoin(api_url, path)
    except RuntimeError:
        return None
