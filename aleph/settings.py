# Configuration defaults.
#
# You should never edit this file directly for deployment or in the developer
# setup. Wherever possible use environment variables to override the
# defaults.
import os
from servicelayer import env
from servicelayer import settings as sls
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
APP_NAME = env.get('ALEPH_APP_NAME', 'aleph')
APP_UI_URL = env.get('ALEPH_UI_URL', 'http://localhost:8080/')
APP_LOGO = env.get('ALEPH_LOGO', '/static/logo.png')
APP_FAVICON = env.get('ALEPH_FAVICON', '/static/logo.png')

# Force HTTPS here:
URL_SCHEME = env.get('ALEPH_URL_SCHEME', 'http')

# Shown on the home page as a few sample queries:
SAMPLE_SEARCHES = [lazy_gettext('TeliaSonera'), lazy_gettext('Vladimir Putin')]
SAMPLE_SEARCHES = env.to_list('ALEPH_SAMPLE_SEARCHES', SAMPLE_SEARCHES)

# Cross-origin resource sharing
CORS_ORIGINS = env.to_list('ALEPH_CORS_ORIGINS', separator='|')


###############################################################################
# Data storage

# Archive type (either 's3' or 'file', i.e. local file system):
ARCHIVE_TYPE = env.get('ALEPH_ARCHIVE_TYPE', 'file')
ARCHIVE_BUCKET = env.get('ALEPH_ARCHIVE_BUCKET')
ARCHIVE_PATH = env.get('ALEPH_ARCHIVE_PATH')
ARCHIVE_AWS_KEY_ID = env.get('AWS_ACCESS_KEY_ID')
ARCHIVE_AWS_SECRET = env.get('AWS_SECRET_ACCESS_KEY')
ARCHIVE_AWS_REGION = env.get('ARCHIVE_REGION', 'eu-west-1')

##############################################################################
# Security and authentication.

# Required: set a secret key
SECRET_KEY = env.get('ALEPH_SECRET_KEY')

# Designate users with the given email as admins automatically:
# Assumes a comma-separated list.
ADMINS = env.to_list('ALEPH_ADMINS')

# Set the foreign ID of the default system user.
SYSTEM_USER = env.get('ALEPH_SYSTEM_USER', 'system:aleph')

# Configure your OAUTH login provider, providing the details as described in
# https://flask-oauthlib.readthedocs.io/en/latest/client.html
#
OAUTH = env.to_bool('ALEPH_OAUTH', False)
OAUTH_NAME = env.get('ALEPH_OAUTH_NAME', 'google')
OAUTH_KEY = env.get('ALEPH_OAUTH_KEY')
OAUTH_SECRET = env.get('ALEPH_OAUTH_SECRET')
OAUTH_SCOPE = env.get('ALEPH_OAUTH_SCOPE')
OAUTH_BASE_URL = env.get('ALEPH_OAUTH_BASE_URL')
OAUTH_REQUEST_TOKEN_URL = env.get('ALEPH_OAUTH_REQUEST_TOKEN_URL')
OAUTH_TOKEN_METHOD = env.get('ALEPH_OAUTH_TOKEN_METHOD', 'POST')
OAUTH_TOKEN_URL = env.get('ALEPH_OAUTH_TOKEN_URL')
OAUTH_AUTHORIZE_URL = env.get('ALEPH_OAUTH_AUTHORIZE_URL')

# Disable password-based authentication for SSO settings:
PASSWORD_LOGIN = env.to_bool('ALEPH_PASSWORD_LOGIN', not OAUTH)


###############################################################################
# Content processing options

DEFAULT_LANGUAGE = env.get('ALEPH_DEFAULT_LANGUAGE', 'en')

# Microservice for tesseract
OCR_SERVICE = 'recognize-text:50000'
sls.OCR_SERVICE = env.get('ALEPH_OCR_SERVICE', OCR_SERVICE)

# Entity extraction service
NER_SERVICE = 'extract-entities:50000'
sls.NER_SERVICE = env.get('ALEPH_NER_SERVICE', NER_SERVICE)

# Language whitelist
LANGUAGES = ['en', 'fr', 'de', 'ru', 'es', 'nl', 'ro', 'ka', 'ar', 'tr', 'lb',
             'el', 'lt', 'uk', 'zh', 'be', 'bg', 'bs', 'ja', 'cs', 'lv', 'pt',
             'pl', 'hy', 'hr', 'hi', 'he', 'uz', 'mo', 'mn', 'ur', 'sq', 'ko',
             'is', 'it', 'et', 'no', 'fa', 'sw', 'sl', 'az']
LANGUAGES = env.to_list('ALEPH_LANGUAGES', LANGUAGES)
LANGUAGES = [l.lower().strip() for l in LANGUAGES]

# User interface
UI_LANGUAGES = ['ru', 'es', 'de', 'bs', 'en']
UI_LANGUAGES = env.to_list('ALEPH_UI_LANGUAGES', UI_LANGUAGES)
UI_LANGUAGES = [l.lower().strip() for l in UI_LANGUAGES]

# Geonames data file
GEONAMES_DATA = env.get('ALEPH_GEONAMES_DATA')

# Result high-lighting
RESULT_HIGHLIGHT = env.to_bool('ALEPH_RESULT_HIGHLIGHT', True)

# Minimum update date for sitemap.xml
SITEMAP_FLOOR = '2018-12-09'


##############################################################################
# E-mail settings

MAIL_FROM = env.get('ALEPH_MAIL_FROM', 'aleph@domain.com')
MAIL_SERVER = env.get('ALEPH_MAIL_HOST', 'localhost')
MAIL_USERNAME = env.get('ALEPH_MAIL_USERNAME')
MAIL_PASSWORD = env.get('ALEPH_MAIL_PASSWORD')
MAIL_USE_SSL = env.to_bool('ALEPH_MAIL_SSL', True)
MAIL_PORT = env.to_int('ALEPH_MAIL_PORT', 465)


###############################################################################
# Database, search index and queue processing.

DATABASE_URI = env.get('ALEPH_DATABASE_URI')
SQLALCHEMY_TRACK_MODIFICATIONS = False
ALEMBIC_DIR = os.path.join(os.path.dirname(__file__), 'migrate')
ALEMBIC_DIR = os.path.abspath(ALEMBIC_DIR)

ELASTICSEARCH_URL = env.get('ALEPH_ELASTICSEARCH_URI', 'http://localhost:9200')
ELASTICSEARCH_SHARDS = env.to_int('ELASTICSEARCH_SHARDS', 5)
ELASTICSEARCH_TIMEOUT = env.to_int('ELASTICSEARCH_TIMEOUT', 300)

ENTITIES_INDEX = '%s-entity-v1' % APP_NAME
ENTITIES_INDEX = env.get('ALEPH_ENTITIES_INDEX', ENTITIES_INDEX)
ENTITIES_INDEX_SPLIT = env.to_bool('ALEPH_ENTITIES_INDEX_SPLIT', False)
ENTITIES_INDEX_SET = env.to_list('ALEPH_ENTITIES_INDEX_SET')

RECORDS_INDEX = '%s-record-v1' % APP_NAME
RECORDS_INDEX = env.get('ALEPH_RECORDS_INDEX', RECORDS_INDEX)
RECORDS_INDEX_SET = env.to_list('ALEPH_RECORDS_INDEX_SETs', [RECORDS_INDEX])

COLLECTIONS_INDEX = '%s-collection-v1' % APP_NAME
COLLECTIONS_INDEX = env.get('ALEPH_COLLECTIONS_INDEX', COLLECTIONS_INDEX)

# Disable delayed processing via queue
EAGER = env.to_bool('ALEPH_EAGER', DEBUG)
QUEUE_PREFIX = env.get('ALEPH_QUEUE_PREFIX', APP_NAME)
QUEUE_NAME = '%s_worker' % QUEUE_PREFIX
QUEUE_ROUTING_KEY = 'worker.process'

BROKER_URI = 'amqp://guest:guest@localhost:5672//'
BROKER_URI = env.get('ALEPH_BROKER_URI', BROKER_URI)

sls.REDIS_URL = sls.REDIS_URL or 'redis://redis:6379/0'

STACKDRIVER_TRACE_PROJECT_ID = env.get('ALEPH_STACKDRIVER_TRACE_PROJECT_ID')
TRACE_SAMPLING_RATE = float(env.get('ALEPH_TRACE_SAMPLING_RATE', 0.10))
CELERY_TRACE_SAMPLING_RATE = env.get('ALEPH_CELERY_TRACE_SAMPLING_RATE', 0.01)
CELERY_TRACE_SAMPLING_RATE = float(CELERY_TRACE_SAMPLING_RATE)
