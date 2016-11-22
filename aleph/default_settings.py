from celery.schedules import crontab
from tempfile import gettempdir
from os import environ as env, path

DEBUG = True
ASSETS_DEBUG = True
CACHE = True

APP_TITLE = 'Aleph'
APP_NAME = 'aleph'
APP_LOGO = '/static/images/aleph_small.png'
APP_FAVICON = '/static/images/aleph_small.png'
APP_BASEURL = 'http://localhost:5000/'

# Archive type (either S3 or file, i.e. local file system):
ARCHIVE_TYPE = 'file'
ARCHIVE_AWS_KEY_ID = env.get('AWS_ACCESS_KEY_ID')
ARCHIVE_AWS_SECRET = env.get('AWS_SECRET_ACCESS_KEY')
# ARCHIVE_BUCKET = 'aleph2-dev.pudo.org'
ARCHIVE_PATH = env.get('ARCHIVE_PATH', '/srv/data/aleph')

# A temporary folder for uploads:
UPLOAD_FOLDER = path.join(gettempdir(), 'aleph_uploads')

# Maximum upload size:
MAX_CONTENT_LENGTH = 500 * 1024 * 1024

# Set up a custom SCSS file with additional style rules here.
CUSTOM_SCSS_PATH = None
CUSTOM_TEMPLATES_DIR = []

# Shown on the home page as a few sample queries:
SAMPLE_SEARCHES = ['Serbia', 'TeliaSonera', 'Vladimir Putin']

# Language configuration
DEFAULT_LANGUAGE = 'en'

# Language whitelist
LANGUAGES = ['en', 'fr', 'de', 'ru', 'es', 'nl', 'ro', 'ka', 'ar', 'tr', 'lb',
             'el', 'lt', 'uk', 'zh', 'be', 'bg', 'bs', 'ja', 'cs', 'lv', 'pt',
             'pl', 'hy', 'hr', 'hi', 'he', 'uz', 'mo', 'mn', 'ur', 'sq', 'ko',
             'is', 'it', 'et', 'no', 'fa', 'sw', 'sl', 'az']

# Category schema for collections.
# TODO: add extra weight info.
COLLECTION_CATEGORIES = {
    'news': 'News archives',
    'leak': 'Leaks',
    'gazette': 'Gazettes',
    'court': 'Court archives',
    'company': 'Company registries',
    'watchlist': 'Watchlists',
    'investigation': 'Personal collections',
    'sanctions': 'Sanctions lists',
    'scrape': 'Scrapes',
    'procurement': 'Procurement',
    'grey': 'Grey literature'
}

# Binary paths for programs to which the ingestor shells out:
TESSDATA_PREFIX = env.get('TESSDATA_PREFIX')
PDFTOHTML_BIN = env.get('PDFTOHTML_BIN', 'pdftohtml')
CONVERT_BIN = env.get('CONVERT_BIN', 'convert')
SOFFICE_BIN = env.get('SOFFICE_BIN', 'soffice')
WKHTMLTOPDF_BIN = env.get('WKHTMLTOPDF_BIN', 'wkhtmltopdf')
DDJVU_BIN = env.get('DDJVU_BIN', 'ddjvu')
MDB_TABLES_BIN = env.get('MDB_TABLES_BIN', 'mdb-tables')
MDB_EXPORT_BIN = env.get('MDB_EXPORT_BIN', 'mdb-export')
SEVENZ_BIN = env.get('SEVENZ_BIN', '7z')
# OCR_PDF_PAGES = True
OCR_DEFAULTS = ['en']

# Use Apache Tika for PDF extraction:
TIKA_URI = env.get('TIKA_URI')

# Enable the Aho Corasick based entity string matcher:
REGEX_ENTITIES = True

# Disable all crawlers (temporarily?)
DISABLE_CRAWLERS = False

SECRET_KEY = env.get('SECRET_KEY')

# Designate users with the given email as admins automatically:
# Assumes a comma-separated list.
AUTHZ_ADMINS = env.get('AUTHZ_ADMINS', '')

SQLALCHEMY_DATABASE_URI = env.get('DATABASE_URL', 'sqlite:///aleph.sqlite3')
SQLALCHEMY_TRACK_MODIFICATIONS = False

ELASTICSEARCH_URL = env.get('BONSAI_URL', 'http://localhost:9200')

ALEMBIC_DIR = path.join(path.dirname(__file__), 'migrate')
ALEMBIC_DIR = path.abspath(ALEMBIC_DIR)

CELERY_ALWAYS_EAGER = False
CELERY_BROKER_URL = env.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672//')  # noqa
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

OAUTH = [{
    'name': 'google',
    'consumer_key': env.get('OAUTH_KEY'),
    'consumer_secret': env.get('OAUTH_SECRET'),
    'request_token_params': {
        'scope': 'https://www.googleapis.com/auth/userinfo.email'
    },
    'base_url': 'https://www.googleapis.com/oauth2/v1/',
    'request_token_url': None,
    'access_token_method': 'POST',
    'access_token_url': 'https://accounts.google.com/o/oauth2/token',
    'authorize_url': 'https://accounts.google.com/o/oauth2/auth',
}]
