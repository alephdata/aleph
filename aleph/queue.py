from aleph.core import create_app, celery as app  # noqa

from aleph.ingest import ingest_url, ingest  # noqa
from aleph.analyze import analyze_document, analyze_source  # noqa
from aleph.index import index_document  # noqa
from aleph.alerts import check_alerts  # noqa
from aleph.entities import reindex_entities  # noqa
from aleph.crawlers import execute_crawler  # noqa

flask_app = create_app()
flask_app.app_context().push()
