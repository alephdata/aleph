# Configuration defaults.
#
# You should never edit this file directly for deployment or in the developer
# setup. Wherever possible use environment variables to override the
# defaults. If that is not sufficient, point the envrionment variable
# ALEPH_SETTINGS to a new Python file that overrides the settings you need to
# alter.
from celery.schedules import crontab
from apikit.args import BOOL_TRUISH
from tempfile import gettempdir
from os import environ as env, path


def env_bool(name, default=False):
    """Extract a boolean value from the environment consistently."""
    if name in env:
        return env.get(name).lower().strip() in BOOL_TRUISH
    return default


def env_list(name, default=[]):
    """Extract a list of values from the environment consistently.

    Multiple values are expected to be separated by a colon (':'), like in the
    UNIX $PATH variable.
    """
    if name in env:
        return [e.strip() for e in env.get(name).split(':')]
    return default


# Show error messages to the user.
DEBUG = env_bool('ALEPH_DEBUG', False)
# Propose HTTP caching to the user agents.
CACHE = env_bool('ALEPH_CACHE', not DEBUG)
# Puts the system into read-only mode and displays a warning.
MAINTENANCE = env_bool('ALEPH_MAINTENANCE', False)


###############################################################################
# General instance information

APP_TITLE = env.get('ALEPH_APP_TITLE', 'Aleph')
APP_NAME = env.get('ALEPH_APP_NAME', 'aleph')
APP_BASEURL = env.get('ALEPH_APP_URL', 'http://localhost:5000/')
APP_LOGO = env.get('ALEPH_LOGO', '/static/images/aleph_small.png')
APP_FAVICON = env.get('ALEPH_FAVICON', '/static/images/aleph_small.png')

# Force HTTPS here:
PREFERRED_URL_SCHEME = env.get('ALEPH_URL_SCHEME', 'http')

# Shown on the home page as a few sample queries:
SAMPLE_SEARCHES = ['TeliaSonera', 'Vladimir Putin']
SAMPLE_SEARCHES = env_list('ALEPH_SAMPLE_SEARCHES', SAMPLE_SEARCHES)

# Graph / Databases component configuration
LOCAL_PATH = path.dirname(__file__)
SCHEMA_YAML = path.join(LOCAL_PATH, 'schema.yaml')
DATASETS_YAML = path.join(LOCAL_PATH, '../mappings/default.yml')
DATASETS_YAML = env.get('ALEPH_DATASETS', DATASETS_YAML)

# Set up a custom SCSS file with additional style rules here.
CUSTOM_SCSS_PATH = None
CUSTOM_TEMPLATES_DIR = []


###############################################################################
# Data storage

# Archive type (either 's3' or 'file', i.e. local file system):
ARCHIVE_TYPE = env.get('ALEPH_ARCHIVE_TYPE', 'file')
ARCHIVE_AWS_KEY_ID = env.get('AWS_ACCESS_KEY_ID')
ARCHIVE_AWS_SECRET = env.get('AWS_SECRET_ACCESS_KEY')
ARCHIVE_BUCKET = env.get('ALEPH_ARCHIVE_BUCKET')
ARCHIVE_PATH = env.get('ALEPH_ARCHIVE_PATH')

# A temporary folder for uploads:
UPLOAD_FOLDER = path.join(gettempdir(), 'aleph_uploads')

# Maximum upload size:
MAX_CONTENT_LENGTH = int(env.get('ALEPH_MAX_CONTENT_LENGTH',
                                 500 * 1024 * 1024))


##############################################################################
# Security and authentication.

# Required: set a secret key
SECRET_KEY = env.get('ALEPH_SECRET_KEY')

# Disable password-based authentication for SSO settings:
PASSWORD_LOGIN = env_bool('ALEPH_PASSWORD_LOGIN', True)
PASSWORD_REGISTRATION = env_bool('ALEPH_PASSWORD_REGISTRATION', True)

# LDAP Support
LDAP_HOST = env.get('ALEPH_LDAP_HOST')
LDAP_PORT = env.get('ALEPH_LDAP_PORT')
LDAP_BASE_DN = env.get('ALEPH_LDAP_BASE_DN', 'uid={},dc=example,dc=com')
LDAP_USERNAME = env.get("ALEPH_LDAP_USERNAME")
LDAP_PASSWORD = env.get('ALEPH_LDAP_PASSWORD')

# Designate users with the given email as admins automatically:
# Assumes a comma-separated list.
AUTHZ_ADMINS = env_list('ALEPH_ADMINS')

# Configure your choice of OAUTH login providers, one
# entry for each provider, providing the details as described in
# https://flask-oauthlib.readthedocs.io/en/latest/client.html
#
# In addition, include a 'name' entry and an optional 'label' entry.
OAUTH = [{
    'name': 'google',
    'label': 'Google',
    'consumer_key': env.get('ALEPH_OAUTH_KEY'),
    'consumer_secret': env.get('ALEPH_OAUTH_SECRET'),
    'request_token_params': {
        'scope': 'https://www.googleapis.com/auth/userinfo.email'
    },
    'base_url': 'https://www.googleapis.com/oauth2/v1/',
    'request_token_url': None,
    'access_token_method': 'POST',
    'access_token_url': 'https://accounts.google.com/o/oauth2/token',
    'authorize_url': 'https://accounts.google.com/o/oauth2/auth',
}]


###############################################################################
# Content processing options

DEFAULT_LANGUAGE = env.get('ALEPH_DEFAULT_LANGUAGE', 'en')
# OCR_PDF_PAGES = True

# When no language is assigned, OCR will include these options:
OCR_DEFAULTS = env_list('ALEPH_OCR_DEFAULTS', [DEFAULT_LANGUAGE])

# Use Apache Tika for PDF extraction:
TIKA_URI = env.get('ALEPH_TIKA_URI')

# Enable the Aho Corasick based entity string matcher:
REGEX_ENTITIES = env_bool('ALEPH_REGEX_ENTITIES', True)

# Disable all crawlers (temporarily?)
DISABLE_CRAWLERS = env_bool('ALEPH_DISABLE_CRAWLERS', False)

# Automatically OCR pdf contents:
PDF_OCR_PAGES = env_bool('ALEPH_PDF_OCR_PAGES', True)

# Language whitelist
LANGUAGES = ['en', 'fr', 'de', 'ru', 'es', 'nl', 'ro', 'ka', 'ar', 'tr', 'lb',
             'el', 'lt', 'uk', 'zh', 'be', 'bg', 'bs', 'ja', 'cs', 'lv', 'pt',
             'pl', 'hy', 'hr', 'hi', 'he', 'uz', 'mo', 'mn', 'ur', 'sq', 'ko',
             'is', 'it', 'et', 'no', 'fa', 'sw', 'sl', 'az']
LANGUAGES = env_list('ALEPH_LANGUAGES', LANGUAGES)

# Category schema for collections.
# TODO: add extra weight info.
# TODO: how can this be gotten off the environment
COLLECTION_CATEGORIES = {
    'news': 'News archives',
    'leak': 'Leaks',
    'land': 'Land registry',
    'gazette': 'Gazettes',
    'court': 'Court archives',
    'company': 'Company registries',
    'watchlist': 'Watchlists',
    'investigation': 'Personal collections',
    'sanctions': 'Sanctions lists',
    'scrape': 'Scrapes',
    'procurement': 'Procurement',
    'grey': 'Grey literature',
    'license': 'Licenses and concessions',
    'regulatory': 'Regulatory filings'
}


##############################################################################
# E-mail settings

MAIL_FROM = env.get('ALEPH_MAIL_FROM', 'aleph@domain.com')
MAIL_SERVER = env.get('ALEPH_MAIL_HOST', 'localhost')
MAIL_ADMINS = env_list('ALEPH_MAIL_ADMIN')
MAIL_USERNAME = env.get('ALEPH_MAIL_USERNAME')
MAIL_PASSWORD = env.get('ALEPH_MAIL_PASSWORD')
MAIL_USE_TLS = env_bool('ALEPH_MAIL_TLS', False)
MAIL_PORT = int(env.get('ALEPH_MAIL_PORT', 25))


###############################################################################
# Database, search index and queue processing.

SQLALCHEMY_DATABASE_URI = env.get('ALEPH_DATABASE_URI')
SQLALCHEMY_TRACK_MODIFICATIONS = False
ALEMBIC_DIR = path.join(path.dirname(__file__), 'migrate')
ALEMBIC_DIR = path.abspath(ALEMBIC_DIR)

ELASTICSEARCH_URL = env.get('ALEPH_ELASTICSEARCH_URI', 'http://localhost:9200')
ELASTICSEARCH_INDEX = env.get('ALEPH_ELASTICSEARCH_INDEX', APP_NAME)

# Enable delayed processing via queue
CELERY_ALWAYS_EAGER = not env_bool('ALEPH_QUEUE', True)

CELERY_BROKER_URL = 'amqp://guest:guest@localhost:5672//'
CELERY_BROKER_URL = env.get('ALEPH_BROKER_URI', CELERY_BROKER_URL)
CELERYBEAT_SCHEDULE = {
    'alert-every-night': {
        'task': 'aleph.logic.alerts.check_alerts',
        'schedule': crontab(hour=1, minute=30)
    },
    'scheduled-crawlers': {
        'task': 'aleph.crawlers.execute_scheduled',
        'schedule': crontab(hour='*/6', minute=40)
    },
}


###############################################################################
# Binary paths for programs

# TODO: do these need to be prefixed for aleph? Seems counter-productive
TESSDATA_PREFIX = env.get('TESSDATA_PREFIX')
PDFTOHTML_BIN = env.get('PDFTOHTML_BIN', 'pdftohtml')
PDFTOPPM_BIN = env.get('PDFTOPPM_BIN', 'pdftoppm')
CONVERT_BIN = env.get('CONVERT_BIN', 'convert')
SOFFICE_BIN = env.get('SOFFICE_BIN', 'soffice')
WKHTMLTOPDF_BIN = env.get('WKHTMLTOPDF_BIN', 'wkhtmltopdf')
DDJVU_BIN = env.get('DDJVU_BIN', 'ddjvu')
MDB_TABLES_BIN = env.get('MDB_TABLES_BIN', 'mdb-tables')
MDB_EXPORT_BIN = env.get('MDB_EXPORT_BIN', 'mdb-export')
SEVENZ_BIN = env.get('SEVENZ_BIN', '7z')
