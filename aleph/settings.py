# Configuration defaults.
#
# You should never edit this file directly for deployment or in the developer
# setup. Wherever possible use environment variables to override the
# defaults.
import os
import multiprocessing
from servicelayer import env
from urllib.parse import urlparse
from flask_babel import lazy_gettext
from datetime import timedelta

# The aleph module directory
APP_DIR = os.path.abspath(os.path.dirname(__file__))


# Show error messages to the user.
DEBUG = env.to_bool("ALEPH_DEBUG", False)
# Profile requests
PROFILE = env.to_bool("ALEPH_PROFILE", False)
# Propose HTTP caching to the user agents.
CACHE = env.to_bool("ALEPH_CACHE", not DEBUG)
# Puts the system into read-only mode and displays a warning.
MAINTENANCE = env.to_bool("ALEPH_MAINTENANCE", False)
# Unit test context.
TESTING = False


###############################################################################
# General instance information

APP_TITLE = env.get("ALEPH_APP_TITLE", lazy_gettext("Aleph"))
APP_NAME = env.get("ALEPH_APP_NAME", "aleph")
APP_UI_URL = env.get("ALEPH_UI_URL", "http://localhost:8080/")
APP_LOGO = env.get("ALEPH_LOGO", "/static/logo.png")
APP_LOGO_AR = env.get("ALEPH_LOGO_AR", APP_LOGO)
APP_FAVICON = env.get("ALEPH_FAVICON", "/static/favicon.png")

# Show a system-wide banner in the user interface.
APP_BANNER = env.get("ALEPH_APP_BANNER")

# Force HTTPS here:
FORCE_HTTPS = True if APP_UI_URL.lower().startswith("https") else False
FORCE_HTTPS = env.to_bool("ALEPH_FORCE_HTTPS", FORCE_HTTPS)
PREFERRED_URL_SCHEME = "https" if FORCE_HTTPS else "http"
PREFERRED_URL_SCHEME = env.get("ALEPH_URL_SCHEME", PREFERRED_URL_SCHEME)
# Apply HTTPS rules to the UI URL:
APP_PARSED_UI_URL = urlparse(APP_UI_URL)._replace(scheme=PREFERRED_URL_SCHEME)
APP_UI_URL = APP_PARSED_UI_URL.geturl()

# Content security policy:
CONTENT_POLICY = "default-src: 'self' 'unsafe-inline' 'unsafe-eval' data: *"
CONTENT_POLICY = env.get("ALEPH_CONTENT_POLICY", CONTENT_POLICY)

# Cross-origin resource sharing
CORS_ORIGINS = env.to_list("ALEPH_CORS_ORIGINS", ["*"], separator="|")

##############################################################################
# Security and authentication.

# Required: set a secret key
SECRET_KEY = env.get("ALEPH_SECRET_KEY")

# Designate users with the given email as admins automatically:
# Assumes a comma-separated list.
ADMINS = env.to_list("ALEPH_ADMINS")

# Set the foreign ID of the default system user.
SYSTEM_USER = env.get("ALEPH_SYSTEM_USER", "system:aleph")

# Configure your OAUTH login provider, providing the details as described in
# https://flask-oauthlib.readthedocs.io/en/latest/client.html
#
OAUTH = env.to_bool("ALEPH_OAUTH", False)
# Handler is one of: keycloak, google, cognito, azure (or a plugin)
OAUTH_MIGRATE_SUB = env.to_bool("ALEPH_OAUTH_MIGRATE_SUB", True)
OAUTH_HANDLER = env.get("ALEPH_OAUTH_HANDLER", "oidc")
OAUTH_KEY = env.get("ALEPH_OAUTH_KEY")
OAUTH_SECRET = env.get("ALEPH_OAUTH_SECRET")
OAUTH_SCOPE = env.get("ALEPH_OAUTH_SCOPE", "openid email profile")
OAUTH_AUDIENCE = env.get("ALEPH_OAUTH_AUDIENCE")
OAUTH_METADATA_URL = env.get("ALEPH_OAUTH_METADATA_URL")
OAUTH_TOKEN_METHOD = env.get("ALEPH_OAUTH_TOKEN_METHOD", "POST")
OAUTH_ADMIN_GROUP = env.get("ALEPH_OAUTH_ADMIN_GROUP", "superuser")

# No authentication. Everyone is admin.
SINGLE_USER = env.to_bool("ALEPH_SINGLE_USER")

# Require authentication. No anonymous access
REQUIRE_LOGGED_IN = env.to_bool("ALEPH_REQUIRE_LOGGED_IN", False)

# Default session duration.
SESSION_EXPIRE = 800_000 if SINGLE_USER else 60_000
SESSION_EXPIRE = env.to_int("ALEPH_SESSION_EXPIRE", SESSION_EXPIRE)

# Disable password-based authentication for SSO settings:
PASSWORD_LOGIN = env.to_bool("ALEPH_PASSWORD_LOGIN", not OAUTH)

# Roles that haven't logged in since X months will stop receiving notifications.
ROLE_INACTIVE = env.to_int("ALEPH_ROLE_INACTIVE", 6 * 30)
ROLE_INACTIVE = timedelta(days=ROLE_INACTIVE)

# Delete notifications after N days.
NOTIFICATIONS_DELETE = env.to_int("ALEPH_NOTIFICATIONS_DELETE", 3 * 30)
NOTIFICATIONS_DELETE = timedelta(days=NOTIFICATIONS_DELETE)

###############################################################################
# Content processing options

DEFAULT_LANGUAGE = env.get("ALEPH_DEFAULT_LANGUAGE", "en")

# User interface
UI_LANGUAGES = ["ru", "es", "de", "en", "ar"]
UI_LANGUAGES = env.to_list("ALEPH_UI_LANGUAGES", UI_LANGUAGES)
UI_LANGUAGES = [lang.lower().strip() for lang in UI_LANGUAGES]

# Document processing pipeline
INGEST_PIPELINE = env.to_list("ALEPH_INGEST_PIPELINE", ["analyze"])

# Result high-lighting
RESULT_HIGHLIGHT = env.to_bool("ALEPH_RESULT_HIGHLIGHT", True)

# Minimum update date for sitemap.xml
SITEMAP_FLOOR = "2019-06-22"

# Maximum number of entities to return per property when expanding entities
MAX_EXPAND_ENTITIES = env.to_int("ALEPH_MAX_EXPAND_ENTITIES", 200)

# API rate limiting (req/min for anonymous users)
API_RATE_LIMIT = env.to_int("ALEPH_API_RATE_LIMIT", 30)
API_RATE_WINDOW = 15  # minutes

# Export file size limit
EXPORT_MAX_SIZE = 1 * 1024 * 1024 * 1024  # GB
EXPORT_MAX_SIZE = env.to_int("EXPORT_MAX_SIZE", EXPORT_MAX_SIZE)
# Export result size limit (number of search entities)
EXPORT_MAX_RESULTS = 100_000
EXPORT_MAX_RESULTS = env.to_int("EXPORT_MAX_RESULTS", EXPORT_MAX_RESULTS)

# Mini-CMS
# Pages directory
PAGES_PATH = os.path.join(APP_DIR, "pages")
PAGES_PATH = env.get("ALEPH_PAGES_PATH", PAGES_PATH)

# Publishing network diagram embeds
REACT_FTM_URL = (
    "https://cdn.jsdelivr.net/npm/@alephdata/react-ftm@latest/dist/react-ftm-embed.js"
)

##############################################################################
# E-mail settings

MAIL_FROM = env.get("ALEPH_MAIL_FROM", "aleph@domain.com")
MAIL_SERVER = env.get("ALEPH_MAIL_HOST", "localhost")
MAIL_USERNAME = env.get("ALEPH_MAIL_USERNAME")
MAIL_PASSWORD = env.get("ALEPH_MAIL_PASSWORD")
MAIL_USE_SSL = env.to_bool("ALEPH_MAIL_SSL", False)
MAIL_USE_TLS = env.to_bool("ALEPH_MAIL_TLS", True)
MAIL_PORT = env.to_int("ALEPH_MAIL_PORT", 465)
MAIL_DEBUG = env.to_bool("ALEPH_MAIL_DEBUG", DEBUG)

###############################################################################
# Database and search index

DATABASE_URI = env.get("ALEPH_DATABASE_URI")
SQLALCHEMY_TRACK_MODIFICATIONS = False
ALEMBIC_DIR = os.path.join(APP_DIR, "migrate")

ELASTICSEARCH_URL = env.get("ALEPH_ELASTICSEARCH_URI", "http://localhost:9200")
ELASTICSEARCH_TIMEOUT = env.to_int("ELASTICSEARCH_TIMEOUT", 60)

# Number of replicas to maintain. '2' means 3 overall copies.
INDEX_REPLICAS = env.to_int("ALEPH_INDEX_REPLICAS", 0)
INDEX_PREFIX = env.get("ALEPH_INDEX_PREFIX", APP_NAME)
INDEX_WRITE = env.get("ALEPH_INDEX_WRITE", "v1")
INDEX_READ = env.to_list("ALEPH_INDEX_READ", [INDEX_WRITE])
INDEX_EXPAND_CLAUSE_LIMIT = env.to_int("ALEPH_INDEX_EXPAND_CLAUSE_LIMIT", 10)
INDEX_DELETE_BY_QUERY_BATCHSIZE = env.to_int(
    "ALEPH_INDEX_DELETE_BY_QUERY_BATCHSIZE", 100
)

###############################################################################
# XREF Model Selection
XREF_MODEL = env.get("FTM_COMPARE_MODEL", None)

###############################################################################
# Task Queuue
RABBITMQ_URL = env.get("ALEPH_RABBITMQ_URL", "rabbitmq")
WORKER_THREADS = env.get("ALEPH_WORKER_THREADS", multiprocessing.cpu_count())
