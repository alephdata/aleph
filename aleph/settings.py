# Configuration defaults.
#
# You should never edit this file directly for deployment or in the developer
# setup. Wherever possible use environment variables to override the
# defaults. If that is not sufficient, point the envrionment variable
# ALEPH_SETTINGS to a new Python file that overrides the settings you need to
# alter.
from os import environ as env, path
from banal.bools import BOOL_TRUEISH
from flask.ext.babel import lazy_gettext


def env_bool(name, default=False):
    """Extract a boolean value from the environment consistently."""
    if name in env:
        return env.get(name).lower().strip() in BOOL_TRUEISH
    return default


def env_list(name, default='', separator=':'):
    """Extract a list of values from the environment consistently.

    Multiple values are by default expected to be separated by a colon (':'),
    like in the UNIX $PATH variable.
    """
    if name not in env:
        return default
    return [e.strip() for e in env.get(name).split(separator)]


# Show error messages to the user.
DEBUG = env_bool('ALEPH_DEBUG', False)
# Propose HTTP caching to the user agents.
CACHE = env_bool('ALEPH_CACHE', not DEBUG)
# Puts the system into read-only mode and displays a warning.
MAINTENANCE = env_bool('ALEPH_MAINTENANCE', False)
# Unit test context.
TESING = False


###############################################################################
# General instance information

APP_TITLE = env.get('ALEPH_APP_TITLE', lazy_gettext('Aleph'))
APP_NAME = env.get('ALEPH_APP_NAME', 'aleph')
APP_UI_URL = env.get('ALEPH_UI_URL', 'http://localhost:8080/')
APP_LOGO = env.get('ALEPH_LOGO', '/static/logo.png')
APP_FAVICON = env.get('ALEPH_FAVICON', '/static/logo.png')

# Force HTTPS here:
URL_SCHEME = env.get('ALEPH_URL_SCHEME', 'http')

# Shown on the home page as a few sample queries:
SAMPLE_SEARCHES = [lazy_gettext('TeliaSonera'), lazy_gettext('Vladimir Putin')]
SAMPLE_SEARCHES = env_list('ALEPH_SAMPLE_SEARCHES', SAMPLE_SEARCHES)

# Cross-origin resource sharing
CORS_ORIGINS = env_list('ALEPH_CORS_ORIGINS', separator='|')


###############################################################################
# Error reporting

# Using sentry raven
SENTRY_DSN = env.get('ALEPH_SENTRY_DSN')


###############################################################################
# Data storage

# Archive type (either 's3' or 'file', i.e. local file system):
ARCHIVE_TYPE = env.get('ALEPH_ARCHIVE_TYPE', 'file')
ARCHIVE_AWS_KEY_ID = env.get('AWS_ACCESS_KEY_ID')
ARCHIVE_AWS_SECRET = env.get('AWS_SECRET_ACCESS_KEY')
ARCHIVE_AWS_REGION = env.get('ALEPH_ARCHIVE_REGION', 'eu-west-1')
ARCHIVE_BUCKET = env.get('ALEPH_ARCHIVE_BUCKET')
ARCHIVE_PATH = env.get('ALEPH_ARCHIVE_PATH')

##############################################################################
# Security and authentication.

# Required: set a secret key
SECRET_KEY = env.get('ALEPH_SECRET_KEY')

# Designate users with the given email as admins automatically:
# Assumes a comma-separated list.
ADMINS = env_list('ALEPH_ADMINS')

# Set the foreign ID of the default system user.
SYSTEM_USER = env.get('ALEPH_SYSTEM_USER', 'system:aleph')

# Configure your OAUTH login provider, providing the details as described in
# https://flask-oauthlib.readthedocs.io/en/latest/client.html
#
OAUTH = env_bool('ALEPH_OAUTH', False)
OAUTH_NAME = env.get('ALEPH_OAUTH_NAME', 'google')
OAUTH_KEY = env.get('ALEPH_OAUTH_KEY')
OAUTH_SECRET = env.get('ALEPH_OAUTH_SECRET')
OAUTH_SCOPE = env.get('ALEPH_OAUTH_SCOPE', 'https://www.googleapis.com/auth/userinfo.email')  # noqa
OAUTH_BASE_URL = env.get('ALEPH_OAUTH_BASE_URL', 'https://www.googleapis.com/oauth2/v1/')  # noqa
OAUTH_REQUEST_TOKEN_URL = env.get('ALEPH_OAUTH_REQUEST_TOKEN_URL')
OAUTH_TOKEN_METHOD = env.get('ALEPH_OAUTH_TOKEN_METHOD', 'POST')
OAUTH_TOKEN_URL = env.get('ALEPH_OAUTH_TOKEN_URL', 'https://accounts.google.com/o/oauth2/token')  # noqa
OAUTH_AUTHORIZE_URL = env.get('ALEPH_OAUTH_AUTHORIZE_URL', 'https://accounts.google.com/o/oauth2/auth')  # noqa

# Disable password-based authentication for SSO settings:
PASSWORD_LOGIN = env_bool('ALEPH_PASSWORD_LOGIN', not OAUTH)


###############################################################################
# Content processing options

DEFAULT_LANGUAGE = env.get('ALEPH_DEFAULT_LANGUAGE', 'en')

# When no language is assigned, OCR will include these options:
OCR_DEFAULTS = ['eng']
OCR_DEFAULTS = env_list('ALEPH_OCR_DEFAULTS', OCR_DEFAULTS)

# Language whitelist
LANGUAGES = ['en', 'fr', 'de', 'ru', 'es', 'nl', 'ro', 'ka', 'ar', 'tr', 'lb',
             'el', 'lt', 'uk', 'zh', 'be', 'bg', 'bs', 'ja', 'cs', 'lv', 'pt',
             'pl', 'hy', 'hr', 'hi', 'he', 'uz', 'mo', 'mn', 'ur', 'sq', 'ko',
             'is', 'it', 'et', 'no', 'fa', 'sw', 'sl', 'az']
LANGUAGES = env_list('ALEPH_LANGUAGES', LANGUAGES)
LANGUAGES = [l.lower().strip() for l in LANGUAGES]

# User interface
UI_LANGUAGES = ['ru', 'es', 'de', 'bs', 'en']

# Analyzers to be used for tag extraction:
ANALYZE_LANGUAGE = env_bool('ALEPH_ANAYZE_LANGUAGE', True)
ANALYZE_POLYGLOT = env_bool('ALEPH_ANAYZE_POLYGLOT', True)
ANALYZE_CORASICK = env_bool('ALEPH_ANAYZE_CORASICK', True)
ANALYZE_PHONES = env_bool('ALEPH_ANAYZE_PHONES', True)
ANALYZE_EMAILS = env_bool('ALEPH_ANAYZE_EMAILS', True)
ANALYZE_IPV4 = env_bool('ALEPH_ANAYZE_IPV4', True)
ANALYZE_IPV6 = env_bool('ALEPH_ANAYZE_IPV6', True)
ANALYZE_IBAN = env_bool('ALEPH_ANAYZE_IBAN', True)


##############################################################################
# E-mail settings

MAIL_FROM = env.get('ALEPH_MAIL_FROM', 'aleph@domain.com')
MAIL_SERVER = env.get('ALEPH_MAIL_HOST', 'localhost')
MAIL_USERNAME = env.get('ALEPH_MAIL_USERNAME')
MAIL_PASSWORD = env.get('ALEPH_MAIL_PASSWORD')
MAIL_USE_SSL = env_bool('ALEPH_MAIL_SSL', True)
MAIL_PORT = int(env.get('ALEPH_MAIL_PORT', 465))


##############################################################################
# Linked data notifications

LDN_RECEIVER_URI = env.get('ALEPH_LDN_RECEIVER_URI')
LDN_ACCESS_TOKEN = env.get('ALEPH_LDN_ACCESS_TOKEN')


###############################################################################
# Database, search index and queue processing.

DATABASE_URI = env.get('ALEPH_DATABASE_URI')
SQLALCHEMY_TRACK_MODIFICATIONS = False
ALEMBIC_DIR = path.join(path.dirname(__file__), 'migrate')
ALEMBIC_DIR = path.abspath(ALEMBIC_DIR)

ELASTICSEARCH_URL = env.get('ALEPH_ELASTICSEARCH_URI', 'http://localhost:9200')
ELASTICSEARCH_SHARDS = int(env.get('ALEPH_ELASTICSEARCH_SHARDS', 5))
ELASTICSEARCH_TIMEOUT = float(env.get('ALEPH_ELASTICSEARCH_TIMEOUT', 300))

ENTITIES_INDEX = '%s-entity-v1' % APP_NAME
ENTITIES_INDEX = env.get('ALEPH_ENTITIES_INDEX', ENTITIES_INDEX)
ENTITIES_INDEX_SET = env_list('ALEPH_ENTITIES_INDEX_SET', [ENTITIES_INDEX])

RECORDS_INDEX = '%s-record-v1' % APP_NAME
RECORDS_INDEX = env.get('ALEPH_RECORDS_INDEX', RECORDS_INDEX)
RECORDS_INDEX_SET = env_list('ALEPH_RECORDS_INDEX_SETs', [RECORDS_INDEX])

COLLECTIONS_INDEX = '%s-collection-v1' % APP_NAME
COLLECTIONS_INDEX = env.get('ALEPH_COLLECTIONS_INDEX', COLLECTIONS_INDEX)


# Disable delayed processing via queue
EAGER = env_bool('ALEPH_EAGER', False)
QUEUE_PREFIX = env.get('ALEPH_QUEUE_PREFIX', APP_NAME)
QUEUE_NAME = '%s_worker' % QUEUE_PREFIX
QUEUE_ROUTING_KEY = 'worker.process'

BROKER_URI = 'amqp://guest:guest@localhost:5672//'
BROKER_URI = env.get('ALEPH_BROKER_URI', BROKER_URI)
