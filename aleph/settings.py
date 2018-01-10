# Configuration defaults.
#
# You should never edit this file directly for deployment or in the developer
# setup. Wherever possible use environment variables to override the
# defaults. If that is not sufficient, point the envrionment variable
# ALEPH_SETTINGS to a new Python file that overrides the settings you need to
# alter.
from apikit.args import BOOL_TRUISH
from os import environ as env, path


def env_bool(name, default=False):
    """Extract a boolean value from the environment consistently."""
    if name in env:
        return env.get(name).lower().strip() in BOOL_TRUISH
    return default


def env_list(name, default=[], seperator=':'):
    """Extract a list of values from the environment consistently.

    Multiple values are by default expected to be separated by a colon (':'),
    like in the UNIX $PATH variable.
    """
    if name in env:
        return [e.strip() for e in env.get(name).split(seperator)]
    return default


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

APP_TITLE = env.get('ALEPH_APP_TITLE', 'Aleph')
APP_NAME = env.get('ALEPH_APP_NAME', 'aleph')
APP_UI_URL = env.get('ALEPH_UI_URL', 'http://localhost:3000/')
# APP_LOGO = env.get('ALEPH_LOGO', '/static/images/aleph_small.png')
# APP_FAVICON = env.get('ALEPH_FAVICON', '/static/images/aleph_small.png')

# Force HTTPS here:
URL_SCHEME = env.get('ALEPH_URL_SCHEME')

# Shown on the home page as a few sample queries:
SAMPLE_SEARCHES = ['TeliaSonera', 'Vladimir Putin']
SAMPLE_SEARCHES = env_list('ALEPH_SAMPLE_SEARCHES', SAMPLE_SEARCHES)

# Cross-origin resource sharing
CORS_ORIGINS = env_list('ALEPH_CORS_ORIGINS', seperator='|')


###############################################################################
# Error reporting

# Using sentry raven
SENTRY_DSN = env.get('SENTRY_DSN')


###############################################################################
# Data storage

# Archive type (either 's3' or 'file', i.e. local file system):
ARCHIVE_TYPE = env.get('ALEPH_ARCHIVE_TYPE', 'file')
ARCHIVE_AWS_KEY_ID = env.get('AWS_ACCESS_KEY_ID')
ARCHIVE_AWS_SECRET = env.get('AWS_SECRET_ACCESS_KEY')
ARCHIVE_AWS_REGION = env.get('ALEPH_ARCHIVE_REGION', 'eu-west-1')
ARCHIVE_BUCKET = env.get('ALEPH_ARCHIVE_BUCKET')
ARCHIVE_PATH = env.get('ALEPH_ARCHIVE_PATH')

# Maximum upload size:
MAX_CONTENT_LENGTH = int(env.get('ALEPH_MAX_CONTENT_LENGTH',
                                 500 * 1024 * 1024))


##############################################################################
# Security and authentication.

# Required: set a secret key
SECRET_KEY = env.get('ALEPH_SECRET_KEY')

# Designate users with the given email as admins automatically:
# Assumes a comma-separated list.
ADMINS = env_list('ALEPH_ADMINS')

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
OCR_DEFAULTS = ['eng', 'rus']
OCR_DEFAULTS = env_list('ALEPH_OCR_DEFAULTS', OCR_DEFAULTS)

# Language whitelist
LANGUAGES = ['en', 'fr', 'de', 'ru', 'es', 'nl', 'ro', 'ka', 'ar', 'tr', 'lb',
             'el', 'lt', 'uk', 'zh', 'be', 'bg', 'bs', 'ja', 'cs', 'lv', 'pt',
             'pl', 'hy', 'hr', 'hi', 'he', 'uz', 'mo', 'mn', 'ur', 'sq', 'ko',
             'is', 'it', 'et', 'no', 'fa', 'sw', 'sl', 'az']
LANGUAGES = env_list('ALEPH_LANGUAGES', LANGUAGES)


##############################################################################
# E-mail settings

MAIL_FROM = env.get('ALEPH_MAIL_FROM', 'aleph@domain.com')
MAIL_SERVER = env.get('ALEPH_MAIL_HOST', 'localhost')
MAIL_USERNAME = env.get('ALEPH_MAIL_USERNAME')
MAIL_PASSWORD = env.get('ALEPH_MAIL_PASSWORD')
MAIL_USE_TLS = env_bool('ALEPH_MAIL_TLS', False)
MAIL_PORT = int(env.get('ALEPH_MAIL_PORT', 25))


###############################################################################
# Database, search index and queue processing.

DATABASE_URI = env.get('ALEPH_DATABASE_URI')
SQLALCHEMY_TRACK_MODIFICATIONS = False
ALEMBIC_DIR = path.join(path.dirname(__file__), 'migrate')
ALEMBIC_DIR = path.abspath(ALEMBIC_DIR)

ELASTICSEARCH_URL = env.get('ALEPH_ELASTICSEARCH_URI', 'http://localhost:9200')

# Disable delayed processing via queue
EAGER = env_bool('ALEPH_EAGER', False)

BROKER_URI = 'amqp://guest:guest@localhost:5672//'
BROKER_URI = env.get('ALEPH_BROKER_URI', BROKER_URI)
