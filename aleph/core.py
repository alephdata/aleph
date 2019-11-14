import logging
import google.auth
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
from flask_talisman import Talisman
from followthemoney import set_model_locale
from elasticsearch import Elasticsearch
from urlnormalizer import query_string
from servicelayer.cache import get_redis
from servicelayer.archive import init_archive
from servicelayer.extensions import get_extensions

from aleph import settings, signals
from aleph.cache import Cache
from aleph.oauth import configure_oauth

NONE = '\'none\''
log = logging.getLogger(__name__)

db = SQLAlchemy()
migrate = Migrate()
mail = Mail()
babel = Babel()
talisman = Talisman()


def create_app(config={}):
    app = Flask('aleph')
    app.config.from_object(settings)
    app.config.update(config)

    if 'postgres' not in settings.DATABASE_URI:
        raise RuntimeError("aleph database must be PostgreSQL!")

    app.config.update({
        'SQLALCHEMY_DATABASE_URI': settings.DATABASE_URI,
        'FLASK_SKIP_DOTENV': True,
        'BABEL_DOMAIN': 'aleph',
    })

    migrate.init_app(app, db, directory=settings.ALEMBIC_DIR)
    configure_oauth(app, cache=get_cache())
    mail.init_app(app)
    db.init_app(app)
    babel.init_app(app)
    CORS(app, origins=settings.CORS_ORIGINS)
    feature_policy = {
        'accelerometer': NONE,
        'camera': NONE,
        'geolocation': NONE,
        'gyroscope': NONE,
        'magnetometer': NONE,
        'microphone': NONE,
        'payment': NONE,
        'usb': NONE
    }
    talisman.init_app(app,
                      force_https=settings.FORCE_HTTPS,
                      strict_transport_security=settings.FORCE_HTTPS,
                      feature_policy=feature_policy,
                      content_security_policy=settings.CONTENT_POLICY)

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


@signals.handle_request_log.connect
def stackdriver_log(sender, payload={}):
    if not hasattr(settings, '_gcp_logger'):
        try:
            from google.cloud import logging
            google.auth.default()
            client = logging.Client()
            logger_name = '%s-api' % settings.APP_NAME
            settings._gcp_logger = client.logger(logger_name)
            log.debug("Enabled Stackdriver request logging.")
        except Exception as exc:
            log.debug("Disable Stackdriver: %s", exc)
            settings._gcp_logger = None
    if settings._gcp_logger is not None:
        settings._gcp_logger.log_struct(payload)


@migrate.configure
def configure_alembic(config):
    config.set_main_option('sqlalchemy.url', settings.DATABASE_URI)
    return config


def get_es():
    if not hasattr(settings, '_es_instance'):
        timeout = settings.ELASTICSEARCH_TIMEOUT
        es = Elasticsearch(settings.ELASTICSEARCH_URL, timeout=timeout)
        settings._es_instance = es
    return settings._es_instance


def get_archive():
    if not hasattr(settings, '_archive'):
        settings._archive = init_archive()
    return settings._archive


def get_cache():
    if not hasattr(settings, '_cache') or settings._cache is None:
        settings._cache = Cache(get_redis(), prefix=settings.APP_NAME)
    return settings._cache


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
        if settings.FORCE_HTTPS:
            parsed = urlparse(api_url)
            parsed = parsed._replace(scheme='https')
            api_url = parsed.geturl()
        return urljoin(api_url, path)
    except RuntimeError:
        return None
