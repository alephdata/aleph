# SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
# SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
#
# SPDX-License-Identifier: MIT

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

from aleph import settings
from aleph.cache import Cache
from aleph.oauth import configure_oauth
from aleph.util import LoggingTransport

NONE = "'none'"
log = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
babel = Babel()
talisman = Talisman()


def create_app(config={}):
    configure_logging(level=logging.DEBUG)
    app = Flask("aleph")
    app.config.from_object(settings)
    app.config.update(config)

    if "postgres" not in settings.DATABASE_URI:
        raise RuntimeError("aleph database must be PostgreSQL!")

    app.config.update(
        {
            "SQLALCHEMY_DATABASE_URI": settings.DATABASE_URI,
            "FLASK_SKIP_DOTENV": True,
            "FLASK_DEBUG": settings.DEBUG,
            "BABEL_DOMAIN": "aleph",
            "PROFILE": settings.PROFILE,
        }
    )

    if settings.PROFILE:
        app.wsgi_app = ProfilerMiddleware(app.wsgi_app, restrictions=[30])

    migrate.init_app(app, db, directory=settings.ALEMBIC_DIR)
    configure_oauth(app, cache=get_cache())
    mail.init_app(app)
    db.init_app(app)
    babel.init_app(app)
    CORS(
        app,
        resources=r"/api/*",
        origins=settings.CORS_ORIGINS,
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
        force_https=settings.FORCE_HTTPS,
        strict_transport_security=settings.FORCE_HTTPS,
        feature_policy=feature_policy,
        content_security_policy=settings.CONTENT_POLICY,
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
        options = settings.UI_LANGUAGES
        locale = request.accept_languages.best_match(options)
        locale = locale or str(babel.default_locale)
    except RuntimeError:
        locale = str(babel.default_locale)
    set_model_locale(locale)
    return locale


@migrate.configure
def configure_alembic(config):
    config.set_main_option("sqlalchemy.url", settings.DATABASE_URI)
    return config


def get_es():
    url = settings.ELASTICSEARCH_URL
    timeout = settings.ELASTICSEARCH_TIMEOUT
    for attempt in service_retries():
        try:
            if not hasattr(settings, "_es_instance"):
                # When logging structured logs, use a custom transport to log
                # all es queries and their response time
                if sls.LOG_FORMAT == LOG_FORMAT_JSON:
                    es = Elasticsearch(
                        url, transport_class=LoggingTransport, timeout=timeout
                    )
                else:
                    es = Elasticsearch(url, timeout=timeout)
                es.info()
                settings._es_instance = es
            return settings._es_instance
        except TransportError as exc:
            log.exception("ElasticSearch error: %s", exc.error)
            backoff(failures=attempt)
    raise RuntimeError("Could not connect to ElasticSearch")


def get_archive():
    if not hasattr(settings, "_archive"):
        settings._archive = init_archive()
    return settings._archive


def get_cache():
    if not hasattr(settings, "_cache") or settings._cache is None:
        settings._cache = Cache(get_redis(), prefix=settings.APP_NAME)
    return settings._cache


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
    return urljoin(settings.APP_UI_URL, path)
