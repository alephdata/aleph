# Configuration defaults.
#
# You should never edit this file directly for deployment or in the developer
# setup. Wherever possible use environment variables to override the
# defaults.
from os import environ, path
from banal.bools import as_bool
from flask_babel import lazy_gettext


def env(name, default=None):
    value = environ.get('ALEPH_%s' % name)
    if value is not None:
        return str(value)
    if default is not None:
        return str(default)


def env_bool(name, default=False):
    """Extract a boolean value from the environment consistently."""
    return as_bool(env(name), default=default)


def env_list(name, default='', separator=':'):
    """Extract a list of values from the environment consistently.
    Multiple values are by default expected to be separated by a colon (':'),
    like in the UNIX $PATH variable.
    """
    value = env(name)
    if value is None:
        return default
    return [e.strip() for e in value.split(separator)]


# Show error messages to the user.
DEBUG = env_bool('DEBUG', False)
# Propose HTTP caching to the user agents.
CACHE = env_bool('CACHE', not DEBUG)
# Puts the system into read-only mode and displays a warning.
MAINTENANCE = env_bool('MAINTENANCE', False)
# Unit test context.
TESTING = False


###############################################################################
# General instance information

APP_TITLE = env('APP_TITLE', lazy_gettext('Aleph'))
APP_NAME = env('APP_NAME', 'aleph')
APP_UI_URL = env('UI_URL', 'http://localhost:8080/')
APP_LOGO = env('LOGO', '/static/logo.png')
APP_FAVICON = env('FAVICON', '/static/logo.png')

# Force HTTPS here:
URL_SCHEME = env('URL_SCHEME', 'http')

# Shown on the home page as a few sample queries:
SAMPLE_SEARCHES = [lazy_gettext('TeliaSonera'), lazy_gettext('Vladimir Putin')]
SAMPLE_SEARCHES = env_list('SAMPLE_SEARCHES', SAMPLE_SEARCHES)

# Cross-origin resource sharing
CORS_ORIGINS = env_list('CORS_ORIGINS', separator='|')


###############################################################################
# Error reporting

# Using sentry raven
SENTRY_DSN = env('SENTRY_DSN')


###############################################################################
# Data storage

# Archive type (either 's3' or 'file', i.e. local file system):
ARCHIVE_TYPE = env('ARCHIVE_TYPE', 'file')
ARCHIVE_BUCKET = env('ARCHIVE_BUCKET')
ARCHIVE_PATH = env('ARCHIVE_PATH')
ARCHIVE_AWS_KEY_ID = environ.get('AWS_ACCESS_KEY_ID')
ARCHIVE_AWS_SECRET = environ.get('AWS_SECRET_ACCESS_KEY')
ARCHIVE_AWS_REGION = environ.get('ARCHIVE_REGION', 'eu-west-1')

##############################################################################
# Security and authentication.

# Required: set a secret key
SECRET_KEY = env('SECRET_KEY')

# Designate users with the given email as admins automatically:
# Assumes a comma-separated list.
ADMINS = env_list('ADMINS')

# Set the foreign ID of the default system user.
SYSTEM_USER = env('SYSTEM_USER', 'system:aleph')

# Configure your OAUTH login provider, providing the details as described in
# https://flask-oauthlib.readthedocs.io/en/latest/client.html
#
OAUTH = env_bool('OAUTH', False)
OAUTH_NAME = env('OAUTH_NAME', 'google')
OAUTH_KEY = env('OAUTH_KEY')
OAUTH_SECRET = env('OAUTH_SECRET')
OAUTH_SCOPE = env('OAUTH_SCOPE')
OAUTH_BASE_URL = env('OAUTH_BASE_URL')
OAUTH_REQUEST_TOKEN_URL = env('OAUTH_REQUEST_TOKEN_URL')
OAUTH_TOKEN_METHOD = env('OAUTH_TOKEN_METHOD', 'POST')
OAUTH_TOKEN_URL = env('OAUTH_TOKEN_URL')
OAUTH_AUTHORIZE_URL = env('OAUTH_AUTHORIZE_URL')

# Disable password-based authentication for SSO settings:
PASSWORD_LOGIN = env_bool('PASSWORD_LOGIN', not OAUTH)


###############################################################################
# Content processing options

DEFAULT_LANGUAGE = env('DEFAULT_LANGUAGE', 'en')

# When no language is assigned, OCR will include these options:
OCR_DEFAULTS = ['eng']
OCR_DEFAULTS = env_list('OCR_DEFAULTS', OCR_DEFAULTS)

# Whether to use Google Vision API or not
OCR_VISION_API = env_bool('OCR_VISION_API', False)

# Microservice for tesseract
OCR_SERVICE = 'recognize-text:50000'
OCR_SERVICE = env('OCR_SERVICE', OCR_SERVICE)

# Entity extraction service
NER_SERVICE = 'extract-entities:50000'
NER_SERVICE = env('NER_SERVICE', NER_SERVICE)

# general gRPC settings
GRPC_LB_POLICY = env('GRPC_LB_POLICY', 'round_robin')
GRPC_CONN_AGE = int(env('GRPC_CONN_AGE', 500))  # ms

# Language whitelist
LANGUAGES = ['en', 'fr', 'de', 'ru', 'es', 'nl', 'ro', 'ka', 'ar', 'tr', 'lb',
             'el', 'lt', 'uk', 'zh', 'be', 'bg', 'bs', 'ja', 'cs', 'lv', 'pt',
             'pl', 'hy', 'hr', 'hi', 'he', 'uz', 'mo', 'mn', 'ur', 'sq', 'ko',
             'is', 'it', 'et', 'no', 'fa', 'sw', 'sl', 'az']
LANGUAGES = env_list('LANGUAGES', LANGUAGES)
LANGUAGES = [l.lower().strip() for l in LANGUAGES]

# User interface
UI_LANGUAGES = ['ru', 'es', 'de', 'bs', 'en']
UI_LANGUAGES = env_list('UI_LANGUAGES', UI_LANGUAGES)
UI_LANGUAGES = [l.lower().strip() for l in UI_LANGUAGES]

# Geonames data file
GEONAMES_DATA = env('GEONAMES_DATA')

# Result high-lighting
RESULT_HIGHLIGHT = env_bool('RESULT_HIGHLIGHT', True)

# Minimum update date for sitemap.xml
SITEMAP_FLOOR = '2018-12-09'

##############################################################################
# E-mail settings

MAIL_FROM = env('MAIL_FROM', 'aleph@domain.com')
MAIL_SERVER = env('MAIL_HOST', 'localhost')
MAIL_USERNAME = env('MAIL_USERNAME')
MAIL_PASSWORD = env('MAIL_PASSWORD')
MAIL_USE_SSL = env_bool('MAIL_SSL', True)
MAIL_PORT = int(env('MAIL_PORT', 465))


###############################################################################
# Database, search index and queue processing.

DATABASE_URI = env('DATABASE_URI')
SQLALCHEMY_TRACK_MODIFICATIONS = False
ALEMBIC_DIR = path.join(path.dirname(__file__), 'migrate')
ALEMBIC_DIR = path.abspath(ALEMBIC_DIR)

ELASTICSEARCH_URL = env('ELASTICSEARCH_URI', 'http://localhost:9200')
ELASTICSEARCH_SHARDS = int(env('ELASTICSEARCH_SHARDS', 5))
ELASTICSEARCH_TIMEOUT = float(env('ELASTICSEARCH_TIMEOUT', 300))

ENTITIES_INDEX = '%s-entity-v1' % APP_NAME
ENTITIES_INDEX = env('ENTITIES_INDEX', ENTITIES_INDEX)
ENTITIES_INDEX_SPLIT = env_bool('ENTITIES_INDEX_SPLIT', False)
ENTITIES_INDEX_SET = env_list('ENTITIES_INDEX_SET')

RECORDS_INDEX = '%s-record-v1' % APP_NAME
RECORDS_INDEX = env('RECORDS_INDEX', RECORDS_INDEX)
RECORDS_INDEX_SET = env_list('RECORDS_INDEX_SETs', [RECORDS_INDEX])

COLLECTIONS_INDEX = '%s-collection-v1' % APP_NAME
COLLECTIONS_INDEX = env('COLLECTIONS_INDEX', COLLECTIONS_INDEX)


# Disable delayed processing via queue
EAGER = env_bool('EAGER', DEBUG)
QUEUE_PREFIX = env('QUEUE_PREFIX', APP_NAME)
QUEUE_NAME = '%s_worker' % QUEUE_PREFIX
QUEUE_ROUTING_KEY = 'worker.process'

BROKER_URI = 'amqp://guest:guest@localhost:5672//'
BROKER_URI = env('BROKER_URI', BROKER_URI)

REDIS_URL = env('REDIS_URL', 'redis://redis:6379/0')
REDIS_BATCH_SIZE = int(env('REDIS_BATCH_SIZE', 10000))
REDIS_EXPIRE = int(env('REDIS_EXPIRE', 84600 * 7))

STACKDRIVER_TRACE_PROJECT_ID = env('STACKDRIVER_TRACE_PROJECT_ID')
TRACE_SAMPLING_RATE = float(env('TRACE_SAMPLING_RATE', 0.10))
CELERY_TRACE_SAMPLING_RATE = float(env('CELERY_TRACE_SAMPLING_RATE', 0.01))
