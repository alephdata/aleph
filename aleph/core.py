import logging
from urllib.parse import urljoin, urlencode
from werkzeug.local import LocalProxy
from werkzeug.middleware.profiler import ProfilerMiddleware
from flask import Flask, request
from flask import url_for as flask_url_for
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_mail import Mail
from flask_cors import CORS
from flask_babel import Babel
from flask_talisman import Talisman
from followthemoney import set_model_locale
from elasticsearch import Elasticsearch, TransportError
from servicelayer.cache import get_redis
from servicelayer.archive import init_archive
from servicelayer.extensions import get_extensions
from servicelayer.util import service_retries, backoff
from servicelayer.logs import configure_logging, LOG_FORMAT_JSON
from servicelayer import settings as sls

from aleph import __version__ as aleph_version
from aleph.settings import SETTINGS
from aleph.cache import Cache
from aleph.oauth import configure_oauth
from aleph.util import LoggingTransport

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration


NONE = "'none'"
log = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
babel = Babel()
talisman = Talisman()


def create_app(config=None):
    if config is None:
        config = {}

    configure_logging(level=logging.DEBUG)

    if SETTINGS.SENTRY_DSN:
        sentry_sdk.init(
            dsn=SETTINGS.SENTRY_DSN,
            integrations=[
                FlaskIntegration(),
            ],
            traces_sample_rate=0,
            release=aleph_version,
            environment=SETTINGS.SENTRY_ENVIRONMENT,
            send_default_pii=False,
            event_scrubber=sentry_sdk.scrubber.EventScrubber(),
        )
    app = Flask("aleph")
    app.config.from_object(SETTINGS)
    app.config.update(config)

    if "postgres" not in SETTINGS.DATABASE_URI:
        raise RuntimeError("aleph database must be PostgreSQL!")

    app.config.update(
        {
            "SQLALCHEMY_DATABASE_URI": SETTINGS.DATABASE_URI,
            "FLASK_SKIP_DOTENV": True,
            "FLASK_DEBUG": SETTINGS.DEBUG,
            "BABEL_DOMAIN": "aleph",
            "PROFILE": SETTINGS.PROFILE,
        }
    )

    if SETTINGS.PROFILE:
        app.wsgi_app = ProfilerMiddleware(app.wsgi_app, restrictions=[30])

    migrate.init_app(app, db, directory=SETTINGS.ALEMBIC_DIR)
    configure_oauth(app, cache=get_cache())
    mail.init_app(app)
    db.init_app(app)
    babel.init_app(app)
    CORS(
        app,
        resources=r"/api/*",
        origins=SETTINGS.CORS_ORIGINS,
        supports_credentials=True,
    )
    feature_policy = {
        "accelerometer": NONE,
        "camera": NONE,
        "geolocation": NONE,
        "gyroscope": NONE,
        "magnetometer": NONE,
        "microphone": NONE,
        "payment": NONE,
        "usb": NONE,
    }
    talisman.init_app(
        app,
        force_https=SETTINGS.FORCE_HTTPS,
        strict_transport_security=SETTINGS.FORCE_HTTPS,
        feature_policy=feature_policy,
        content_security_policy=SETTINGS.CONTENT_POLICY,
    )

    from aleph.views import mount_app_blueprints

    mount_app_blueprints(app)

    # This executes all registered init-time plugins so that other
    # applications can register their behaviour.
    for plugin in get_extensions("aleph.init"):
        plugin(app=app)

    return app


@babel.localeselector
def determine_locale():
    try:
        options = SETTINGS.UI_LANGUAGES
        locale = request.accept_languages.best_match(options)
        locale = locale or str(babel.default_locale)
    except RuntimeError:
        locale = str(babel.default_locale)
    set_model_locale(locale)
    return locale


@migrate.configure
def configure_alembic(config):
    config.set_main_option("sqlalchemy.url", SETTINGS.DATABASE_URI)
    return config


def get_es():
    url = SETTINGS.ELASTICSEARCH_URL
    timeout = SETTINGS.ELASTICSEARCH_TIMEOUT
    for attempt in service_retries():
        try:
            if not hasattr(SETTINGS, "_es_instance"):
                # When logging structured logs, use a custom transport to log
                # all es queries and their response time
                if sls.LOG_FORMAT == LOG_FORMAT_JSON:
                    es = Elasticsearch(
                        url, transport_class=LoggingTransport, timeout=timeout
                    )
                else:
                    es = Elasticsearch(url, timeout=timeout)
                es.info()
                SETTINGS._es_instance = es
            return SETTINGS._es_instance
        except TransportError as exc:
            log.exception("ElasticSearch error: %s", exc.error)
            backoff(failures=attempt)
    raise RuntimeError("Could not connect to ElasticSearch")


def get_archive():
    if not hasattr(SETTINGS, "_archive"):
        SETTINGS._archive = init_archive()
    return SETTINGS._archive


def get_cache():
    if not hasattr(SETTINGS, "_cache") or SETTINGS._cache is None:
        SETTINGS._cache = Cache(get_redis(), prefix=SETTINGS.APP_NAME)
    return SETTINGS._cache


es = LocalProxy(get_es)
kv = LocalProxy(get_redis)
cache = LocalProxy(get_cache)
archive = LocalProxy(get_archive)


def url_for(*a, **kw):
    """Overwrite Flask url_for to force external paths."""
    try:
        kw["_external"] = False
        query = kw.pop("_query", None)
        relative = kw.pop("_relative", False)
        path = flask_url_for(*a, **kw)
        return url_external(path, query, relative=relative)
    except RuntimeError:
        return None


def url_external(path, query, relative=False):
    """Generate external URLs with HTTPS (if configured)."""
    if query is not None:
        path = "%s?%s" % (path, urlencode(query))
    if relative:
        return path
    return urljoin(SETTINGS.APP_UI_URL, path)
