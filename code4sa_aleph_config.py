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

SAMPLE_SEARCHES = ['Eskom', 'SABC', '"call for comment"']

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
BROKER_TRANSPORT_OPTIONS = {
    'region': 'eu-west-1',
    'queue_name_prefix': '%s.' % os.environ.get('ALEPH_APP_NAME', 'aleph')
}

NEO4J_URI = os.environ.get('ALEPH_NEO4J_URI')

ARCHIVE_TYPE = os.environ.get('ALEPH_ARCHIVE_TYPE', 's3')
ARCHIVE_AWS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
ARCHIVE_AWS_SECRET = os.environ.get('AWS_SECRET_ACCESS_KEY')
ARCHIVE_BUCKET = os.environ.get('ALEPH_ARCHIVE_BUCKET')
ARCHIVE_PATH = os.environ.get('ALEPH_ARCHIVE_PATH')

OAUTH = [{
    'name': 'facebook',
    'base_url': 'https://graph.facebook.com/',
    'request_token_url': None,
    'access_token_url': 'oauth/access_token',
    'authorize_url': 'https://www.facebook.com/dialog/oauth',
    'consumer_key': os.environ.get('FACEBOOK_OAUTH_KEY'),
    'consumer_secret': os.environ.get('FACEBOOK_OAUTH_SECRET'),
    'request_token_params': {'scope': 'email'}
}, {
    'name': 'google',
    'consumer_key': os.environ.get('GOOGLE_OAUTH_KEY'),
    'consumer_secret': os.environ.get('GOOGLE_OAUTH_SECRET'),
    'request_token_params': {
        'scope': 'https://www.googleapis.com/auth/userinfo.email'
    },
    'base_url': 'https://www.googleapis.com/oauth2/v1/',
    'request_token_url': None,
    'access_token_method': 'POST',
    'access_token_url': 'https://accounts.google.com/o/oauth2/token',
    'authorize_url': 'https://accounts.google.com/o/oauth2/auth',
}]

OCR_PDF_PAGES = os.environ.get('ALEPH_PDF_OCR_IMAGE_PAGES', 'true')
OCR_PDF_PAGES = OCR_PDF_PAGES.strip().lower() == "true"

MAX_CONTENT_LENGTH = int(os.environ.get('ALEPH_MAX_CONTENT_LENGTH',
                                        500 * 1024 * 1024))

GA_TRACKING_ID = 'UA-48399585-47'
ALLOW_PEEKING = False
