from aleph.core import create_app
from aleph.settings import SETTINGS
from aleph import __version__ as aleph_version

import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration


if SETTINGS.SENTRY_DSN:
    sentry_sdk.init(
        dsn=SETTINGS.SENTRY_DSN,
        integrations=[
            FlaskIntegration(),
        ],
        traces_sample_rate=0,
        release=aleph_version,
        environment=SETTINGS.SENTRY_ENVIRONMENT,
        send_default_pii=False,
    )
app = create_app()
