# Configuration defaults.
#
# You should never edit this file directly for deployment or in the developer
# setup. Wherever possible use environment variables to override the
# defaults.
import json
import os
from datetime import timedelta
from json.decoder import JSONDecodeError
from urllib.parse import urlparse

import structlog
from flask_babel import lazy_gettext
from servicelayer import env

log = structlog.get_logger(__name__)


class Settings:
    def __init__(self) -> None:
        # The aleph module directory
        self.APP_DIR = os.path.abspath(os.path.dirname(__file__))

        # Show error messages to the user.
        self.DEBUG = env.to_bool("ALEPH_DEBUG", False)
        # Profile requests
        self.PROFILE = env.to_bool("ALEPH_PROFILE", False)
        # Propose HTTP caching to the user agents.
        self.CACHE = env.to_bool("ALEPH_CACHE", not self.DEBUG)
        # Puts the system into read-only mode and displays a warning.
        self.MAINTENANCE = env.to_bool("ALEPH_MAINTENANCE", False)
        # Unit test context.
        self.TESTING = False

        ###############################################################################
        # General instance information

        self.APP_TITLE = env.get("ALEPH_APP_TITLE", lazy_gettext("Aleph"))
        self.APP_NAME = env.get("ALEPH_APP_NAME", "aleph")
        self.APP_UI_URL = env.get("ALEPH_UI_URL", "http://localhost:8080/")
        self.APP_LOGO = env.get("ALEPH_LOGO", "/static/logo.png")
        self.APP_LOGO_AR = env.get("ALEPH_LOGO_AR", self.APP_LOGO)
        self.APP_FAVICON = env.get("ALEPH_FAVICON", "/static/favicon.png")

        # Show a system-wide banner in the user interface.
        self.APP_BANNER = env.get("ALEPH_APP_BANNER")
        self.APP_MESSAGES_URL = env.get("ALEPH_APP_MESSAGES_URL", None)

        # Force HTTPS here:
        self.FORCE_HTTPS = env.to_bool(
            "ALEPH_FORCE_HTTPS",
            True if self.APP_UI_URL.lower().startswith("https") else False,
        )
        self.PREFERRED_URL_SCHEME = env.get(
            "ALEPH_URL_SCHEME", "https" if self.FORCE_HTTPS else "http"
        )
        # Apply HTTPS rules to the UI URL:
        self.APP_PARSED_UI_URL = urlparse(self.APP_UI_URL)._replace(
            scheme=self.PREFERRED_URL_SCHEME
        )
        self.APP_UI_URL = self.APP_PARSED_UI_URL.geturl()

        # Cross-origin resource sharing
        self.CORS_ORIGINS = env.to_list("ALEPH_CORS_ORIGINS", ["*"], separator="|")

        ##############################################################################
        # Security and authentication.

        # Required: set a secret key
        self.SECRET_KEY = env.get("ALEPH_SECRET_KEY")

        # Designate users with the given email as admins automatically:
        # Assumes a comma-separated list.
        self.ADMINS = env.to_list("ALEPH_ADMINS")

        # Set the foreign ID of the default system user.
        self.SYSTEM_USER = env.get("ALEPH_SYSTEM_USER", "system:aleph")

        # Configure your OAUTH login provider, providing the details as described in
        # https://flask-oauthlib.readthedocs.io/en/latest/client.html
        #
        self.OAUTH = env.to_bool("ALEPH_OAUTH", False)
        # Handler is one of: keycloak, google, cognito, azure (or a plugin)
        self.OAUTH_MIGRATE_SUB = env.to_bool("ALEPH_OAUTH_MIGRATE_SUB", True)
        self.OAUTH_HANDLER = env.get("ALEPH_OAUTH_HANDLER", "oidc")
        self.OAUTH_KEY = env.get("ALEPH_OAUTH_KEY")
        self.OAUTH_SECRET = env.get("ALEPH_OAUTH_SECRET")
        self.OAUTH_SCOPE = env.get("ALEPH_OAUTH_SCOPE", "openid email profile")
        self.OAUTH_AUDIENCE = env.get("ALEPH_OAUTH_AUDIENCE")
        self.OAUTH_METADATA_URL = env.get("ALEPH_OAUTH_METADATA_URL")
        self.OAUTH_TOKEN_METHOD = env.get("ALEPH_OAUTH_TOKEN_METHOD", "POST")
        self.OAUTH_ADMIN_GROUP = env.get("ALEPH_OAUTH_ADMIN_GROUP", "superuser")

        # No authentication. Everyone is admin.
        self.SINGLE_USER = env.to_bool("ALEPH_SINGLE_USER")

        # Require authentication. No anonymous access
        self.REQUIRE_LOGGED_IN = env.to_bool("ALEPH_REQUIRE_LOGGED_IN", False)

        # Default session duration.
        self.SESSION_EXPIRE = env.to_int(
            "ALEPH_SESSION_EXPIRE", 800_000 if self.SINGLE_USER else 60_000
        )

        # Disable password-based authentication for SSO settings:
        self.PASSWORD_LOGIN = env.to_bool("ALEPH_PASSWORD_LOGIN", not self.OAUTH)

        # Roles that haven't logged in since X months will stop receiving notifications.
        self.ROLE_INACTIVE = timedelta(days=env.to_int("ALEPH_ROLE_INACTIVE", 6 * 30))

        # Delete notifications after N days.
        self.NOTIFICATIONS_DELETE = timedelta(
            days=env.to_int("ALEPH_NOTIFICATIONS_DELETE", 3 * 30)
        )

        ###############################################################################
        # Content processing options

        self.DEFAULT_LANGUAGE = env.get("ALEPH_DEFAULT_LANGUAGE", "en")

        # User interface
        ui_languages = ["ru", "es", "de", "en", "ar", "fr"]
        ui_languages = env.to_list("ALEPH_UI_LANGUAGES", ui_languages)
        self.UI_LANGUAGES = [lang.lower().strip() for lang in ui_languages]

        # Document processing pipeline
        self.INGEST_PIPELINE = env.to_list("ALEPH_INGEST_PIPELINE", ["analyze"])

        # Result high-lighting
        self.RESULT_HIGHLIGHT = env.to_bool("ALEPH_RESULT_HIGHLIGHT", True)

        # Minimum update date for sitemap.xml
        self.SITEMAP_FLOOR = "2019-06-22"

        # Maximum number of entities to return per property when expanding entities
        self.MAX_EXPAND_ENTITIES = env.to_int("ALEPH_MAX_EXPAND_ENTITIES", 200)

        # API rate limiting (req/min for anonymous users)
        self.API_RATE_LIMIT = env.to_int("ALEPH_API_RATE_LIMIT", 30)
        self.API_RATE_WINDOW = 15  # minutes

        # Export file size limit
        self.EXPORT_MAX_SIZE = env.to_int(
            "EXPORT_MAX_SIZE", 1 * 1024 * 1024 * 1024  # 1 GB
        )
        # Export result size limit (number of search entities)
        self.EXPORT_MAX_RESULTS = env.to_int("EXPORT_MAX_RESULTS", 100_000)

        # Mini-CMS
        # Pages directory
        self.PAGES_PATH = env.get(
            "ALEPH_PAGES_PATH", os.path.join(self.APP_DIR, "pages")
        )

        # Publishing network diagram embeds
        self.REACT_FTM_URL = "https://cdn.jsdelivr.net/npm/@alephdata/react-ftm@latest/dist/react-ftm-embed.js"  # noqa

        ##############################################################################
        # E-mail settings

        self.MAIL_FROM = env.get("ALEPH_MAIL_FROM", "aleph@domain.com")
        self.MAIL_SERVER = env.get("ALEPH_MAIL_HOST", "localhost")
        self.MAIL_USERNAME = env.get("ALEPH_MAIL_USERNAME")
        self.MAIL_PASSWORD = env.get("ALEPH_MAIL_PASSWORD")
        self.MAIL_USE_SSL = env.to_bool("ALEPH_MAIL_SSL", False)
        self.MAIL_USE_TLS = env.to_bool("ALEPH_MAIL_TLS", True)
        self.MAIL_PORT = env.to_int("ALEPH_MAIL_PORT", 465)
        self.MAIL_DEBUG = env.to_bool("ALEPH_MAIL_DEBUG", self.DEBUG)

        ###############################################################################
        # Database and search index

        self.DATABASE_URI = env.get("ALEPH_DATABASE_URI")
        self.SQLALCHEMY_TRACK_MODIFICATIONS = False
        self.ALEMBIC_DIR = os.path.join(self.APP_DIR, "migrate")

        self.ELASTICSEARCH_URL = env.get(
            "ALEPH_ELASTICSEARCH_URI", "http://localhost:9200"
        )
        self.ELASTICSEARCH_TLS_CA_CERTS = env.get("ELASTICSEARCH_TLS_CA_CERTS")
        self.ELASTICSEARCH_TLS_VERIFY_CERTS = env.to_bool(
            "ELASTICSEARCH_TLS_VERIFY_CERTS"
        )
        self.ELASTICSEARCH_TLS_CLIENT_CERT = env.get("ELASTICSEARCH_TLS_CLIENT_CERT")
        self.ELASTICSEARCH_TLS_CLIENT_KEY = env.get("ELASTICSEARCH_TLS_CLIENT_KEY")
        self.ELASTICSEARCH_TIMEOUT = env.to_int("ELASTICSEARCH_TIMEOUT", 60)
        self.XREF_SCROLL = env.get("ALEPH_XREF_SCROLL", "5m")
        self.XREF_SCROLL_SIZE = env.get("ALEPH_XREF_SCROLL_SIZE", "1000")

        # Number of replicas to maintain. '2' means 3 overall copies.
        self.INDEX_REPLICAS = env.to_int("ALEPH_INDEX_REPLICAS", 0)
        self.INDEX_PREFIX = env.get("ALEPH_INDEX_PREFIX", self.APP_NAME)
        self.INDEX_WRITE = env.get("ALEPH_INDEX_WRITE", "v1")
        self.INDEX_READ = env.to_list("ALEPH_INDEX_READ", [self.INDEX_WRITE])
        self.INDEX_EXPAND_CLAUSE_LIMIT = env.to_int(
            "ALEPH_INDEX_EXPAND_CLAUSE_LIMIT", 10
        )
        self.INDEX_DELETE_BY_QUERY_BATCHSIZE = env.to_int(
            "ALEPH_INDEX_DELETE_BY_QUERY_BATCHSIZE", 100
        )

        ###############################################################################
        # XREF Model Selection
        self.XREF_MODEL = env.get("FTM_COMPARE_MODEL", None)

        ###############################################################################
        # Feature flags
        self.ENABLE_EXPERIMENTAL_BOOKMARKS_FEATURE = env.get(
            "ALEPH_ENABLE_EXPERIMENTAL_BOOKMARKS_FEATURE", False
        )

        ###############################################################################
        # Feedback
        self.FEEDBACK_URL_DOCUMENTS = env.get("ALEPH_FEEDBACK_URL_DOCUMENTS", None)
        self.FEEDBACK_URL_TIMELINES = env.get("ALEPH_FEEDBACK_URL_TIMELINES", None)

        ###############################################################################
        # Instrumentation and observability
        self.SENTRY_DSN = env.get("SENTRY_DSN", None)
        self.SENTRY_ENVIRONMENT = env.get("SENTRY_ENVIRONMENT", "")

        self.PROMETHEUS_ENABLED = env.to_bool("PROMETHEUS_ENABLED", False)
        self.PROMETHEUS_PORT = env.to_int("PROMETHEUS_PORT", 9100)

        ###############################################################################
        # Additional configuration
        string_prefix = env.get("ALEPH_STRING_CONFIG_PREFIX")
        json_prefix = env.get("ALEPH_JSON_CONFIG_PREFIX")
        if string_prefix or json_prefix:
            for key, value in os.environ.items():
                if (
                    string_prefix
                    and key.startswith(string_prefix)
                    and key != string_prefix
                ):
                    setattr(self, key[len(string_prefix) :], value)
                elif json_prefix and key.startswith(json_prefix) and key != json_prefix:
                    try:
                        json_value = json.loads(value)
                    except JSONDecodeError as e:
                        log.error(
                            f"Could not parse config value as JSON for env var {key}: {value}\n{e}"  # noqa
                        )
                        raise e
                    setattr(self, key[len(json_prefix) :], json_value)


SETTINGS = Settings()
