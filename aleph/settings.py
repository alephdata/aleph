# Configuration defaults.
#
# You should never edit this file directly for deployment or in the developer
# setup. Wherever possible use environment variables to override the
# defaults.
import os
import uuid
from servicelayer import env
from flask_babel import lazy_gettext


# Show error messages to the user.
DEBUG = env.to_bool('ALEPH_DEBUG', False)
# Propose HTTP caching to the user agents.
CACHE = env.to_bool('ALEPH_CACHE', not DEBUG)
# Puts the system into read-only mode and displays a warning.
MAINTENANCE = env.to_bool('ALEPH_MAINTENANCE', False)
# Unit test context.
TESTING = False


###############################################################################
# General instance information

APP_TITLE = env.get('ALEPH_APP_TITLE', lazy_gettext('Aleph'))
APP_DESCRIPTION = env.get('ALEPH_APP_DESCRIPTION', '')
APP_NAME = env.get('ALEPH_APP_NAME', 'aleph')
APP_UI_URL = env.get('ALEPH_UI_URL', 'http://localhost:8080/')
APP_LOGO = env.get('ALEPH_LOGO', '/static/logo.png')
APP_FAVICON = env.get('ALEPH_FAVICON', '/static/favicon.png')

# Show a system-wide banner in the user interface.
APP_BANNER = env.get('ALEPH_APP_BANNER')

# Shown on the home page as a few sample queries:
SAMPLE_SEARCHES = [lazy_gettext('TeliaSonera'), lazy_gettext('Vladimir Putin')]
SAMPLE_SEARCHES = env.to_list('ALEPH_SAMPLE_SEARCHES', SAMPLE_SEARCHES)

# Force HTTPS here:
FORCE_HTTPS = env.to_bool('ALEPH_FORCE_HTTPS', False)

# Content security policy:
CONTENT_POLICY = 'default-src: \'self\' \'unsafe-inline\' \'unsafe-eval\' data: *'  # noqa
CONTENT_POLICY = env.get('ALEPH_CONTENT_POLICY', CONTENT_POLICY)

# Cross-origin resource sharing
CORS_ORIGINS = env.to_list('ALEPH_CORS_ORIGINS', ['*'], separator='|')

# Google Cloud platform config
GOOGLE_REQUEST_LOGGING = env.to_bool('ALEPH_GOOGLE_REQUEST_LOGGING', False)

##############################################################################
# Security and authentication.

# Required: set a secret key
SECRET_KEY = env.get('ALEPH_SECRET_KEY')

# A process identifier
PROCESS_ID = uuid.uuid4().hex

# Designate users with the given email as admins automatically:
# Assumes a comma-separated list.
ADMINS = env.to_list('ALEPH_ADMINS')

# Set the foreign ID of the default system user.
SYSTEM_USER = env.get('ALEPH_SYSTEM_USER', 'system:aleph')

# Configure your OAUTH login provider, providing the details as described in
# https://flask-oauthlib.readthedocs.io/en/latest/client.html
#
OAUTH = env.to_bool('ALEPH_OAUTH', False)
# Handler is one of: keycloak, google, azure (or a plugin)
OAUTH_HANDLER = env.get('ALEPH_OAUTH_HANDLER')
OAUTH_KEY = env.get('ALEPH_OAUTH_KEY')
OAUTH_SECRET = env.get('ALEPH_OAUTH_SECRET')
OAUTH_SCOPE = env.get('ALEPH_OAUTH_SCOPE')
OAUTH_BASE_URL = env.get('ALEPH_OAUTH_BASE_URL')
OAUTH_REQUEST_TOKEN_URL = env.get('ALEPH_OAUTH_REQUEST_TOKEN_URL')
OAUTH_TOKEN_METHOD = env.get('ALEPH_OAUTH_TOKEN_METHOD', 'POST')
OAUTH_TOKEN_URL = env.get('ALEPH_OAUTH_TOKEN_URL')
OAUTH_AUTHORIZE_URL = env.get('ALEPH_OAUTH_AUTHORIZE_URL')
OAUTH_UI_CALLBACK = env.get('ALEPH_OAUTH_UI_CALLBACK', '/oauth')

# No authentication. Everyone is admin.
SINGLE_USER = env.to_bool('ALEPH_SINGLE_USER')

# Disable password-based authentication for SSO settings:
PASSWORD_LOGIN = env.to_bool('ALEPH_PASSWORD_LOGIN', not OAUTH)


###############################################################################
# Content processing options

DEFAULT_LANGUAGE = env.get('ALEPH_DEFAULT_LANGUAGE', 'en')

# User interface
UI_LANGUAGES = ['ru', 'es', 'de', 'bs', 'en']
UI_LANGUAGES = env.to_list('ALEPH_UI_LANGUAGES', UI_LANGUAGES)
UI_LANGUAGES = [l.lower().strip() for l in UI_LANGUAGES]

# Result high-lighting
RESULT_HIGHLIGHT = env.to_bool('ALEPH_RESULT_HIGHLIGHT', True)

# Minimum update date for sitemap.xml
SITEMAP_FLOOR = '2019-06-22'

# Maximum number of entities to return per property when expanding entities
MAX_EXPAND_ENTITIES = env.to_int('ALEPH_MAX_EXPAND_ENTITIES', 200)

# API rate limiting (req/min for anonymous users)
API_RATE_LIMIT = env.to_int('ALEPH_API_RATE_LIMIT', 30)
API_RATE_WINDOW = 15  # minutes


##############################################################################
# E-mail settings

MAIL_FROM = env.get('ALEPH_MAIL_FROM', 'aleph@domain.com')
MAIL_SERVER = env.get('ALEPH_MAIL_HOST', 'localhost')
MAIL_USERNAME = env.get('ALEPH_MAIL_USERNAME')
MAIL_PASSWORD = env.get('ALEPH_MAIL_PASSWORD')
MAIL_USE_SSL = env.to_bool('ALEPH_MAIL_SSL', False)
MAIL_USE_TLS = env.to_bool('ALEPH_MAIL_TLS', True)
MAIL_PORT = env.to_int('ALEPH_MAIL_PORT', 465)
MAIL_DEBUG = env.to_bool('ALEPH_MAIL_DEBUG', DEBUG)


###############################################################################
# Database and search index

DATABASE_URI = env.get('ALEPH_DATABASE_URI')
SQLALCHEMY_TRACK_MODIFICATIONS = False
ALEMBIC_DIR = os.path.join(os.path.dirname(__file__), 'migrate')
ALEMBIC_DIR = os.path.abspath(ALEMBIC_DIR)

ELASTICSEARCH_URL = env.get('ALEPH_ELASTICSEARCH_URI', 'http://localhost:9200')
ELASTICSEARCH_TIMEOUT = env.to_int('ELASTICSEARCH_TIMEOUT', 30)

INDEX_PREFIX = env.get('ALEPH_INDEX_PREFIX', APP_NAME)
INDEX_WRITE = env.get('ALEPH_INDEX_WRITE', 'v1')
INDEX_READ = env.to_list('ALEPH_INDEX_READ', [INDEX_WRITE])
