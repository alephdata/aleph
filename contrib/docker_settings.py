import os

DEBUG = False
ASSETS_DEBUG = False
CACHE = True
SECRET_KEY = os.environ.get('ALEPH_SECRET_KEY')

APP_TITLE = os.environ.get('ALEPH_APP_TITLE', 'Aleph')
APP_NAME = os.environ.get('ALEPH_APP_NAME', 'aleph')
APP_BASEURL = os.environ.get('ALEPH_APP_URL')
APP_LOGO = os.environ.get('ALEPH_LOGO')
APP_FAVICON = os.environ.get('ALEPH_FAVICON')

AUTHZ_ADMINS = os.environ.get('ALEPH_ADMINS')

ELASTICSEARCH_URL = os.environ.get('ALEPH_ELASTICSEARCH_URI')

SQLALCHEMY_DATABASE_URI = os.environ.get('ALEPH_DATABASE_URI')

PREFERRED_URL_SCHEME = os.environ.get('ALEPH_URL_SCHEME')

MAIL_FROM = os.environ.get('MAIL_FROM')
MAIL_SERVER = os.environ.get('MAIL_HOST')
MAIL_ADMINS = [os.environ.get('MAIL_ADMIN')]
MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')

# this is GMail-specific, factor it out?
MAIL_USE_TLS = True
MAIL_PORT = 587

CELERY_BROKER_URL = os.environ.get('ALEPH_BROKER_URI')

NEO4J_URI = os.environ.get('ALEPH_NEO4J_URI')

ARCHIVE_TYPE = os.environ.get('ALEPH_ARCHIVE_TYPE', 'file')
ARCHIVE_AWS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
ARCHIVE_AWS_SECRET = os.environ.get('AWS_SECRET_ACCESS_KEY')
ARCHIVE_BUCKET = os.environ.get('ALEPH_ARCHIVE_BUCKET')
ARCHIVE_PATH = os.environ.get('ALEPH_ARCHIVE_PATH')

# Configure your choice of OAUTH login providers, one
# entry for each provider, providing the details as described in
# https://flask-oauthlib.readthedocs.io/en/latest/client.html
#
# In addition, include a 'name' entry and an optional 'label' entry.
OAUTH = [{
    'name': 'google',
    'label': 'Google',
    'consumer_key': os.environ.get('ALEPH_OAUTH_KEY'),
    'consumer_secret': os.environ.get('ALEPH_OAUTH_SECRET'),
    'request_token_params': {
        'scope': 'https://www.googleapis.com/auth/userinfo.email'
    },
    'base_url': 'https://www.googleapis.com/oauth2/v1/',
    'request_token_url': None,
    'access_token_method': 'POST',
    'access_token_url': 'https://accounts.google.com/o/oauth2/token',
    'authorize_url': 'https://accounts.google.com/o/oauth2/auth',
}]
PASSWORD_LOGIN = True
PASSWORD_REGISTRATION = True

OCR_PDF_PAGES = os.environ.get('ALEPH_PDF_OCR_IMAGE_PAGES', 'true')
OCR_PDF_PAGES = OCR_PDF_PAGES.strip().lower() == "true"

MAX_CONTENT_LENGTH = int(os.environ.get('ALEPH_MAX_CONTENT_LENGTH',
                                        500 * 1024 * 1024))

# Tell users to email the admins if their search has results in collections
# that are hidden from them?
ALLOW_PEEKING = True
