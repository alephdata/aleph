# https://github.com/celery/celery/issues/2615
# Recent versions of billiard have TERMSIGS_DEFAULT as a set() while 3.3.0.23 uses a tuple()
import billiard.common
TERMSIGS_CUSTOM = list(billiard.common.TERMSIGS_DEFAULT)
TERMSIGS_CUSTOM.remove('SIGUSR2')
billiard.common.TERMSIGS_DEFAULT = type(billiard.common.TERMSIGS_DEFAULT)(TERMSIGS_CUSTOM)

from aleph.core import create_app, celery as app  # noqa

from aleph.ingest import ingest_url, ingest  # noqa
from aleph.analyze import analyze_document_id  # noqa
from aleph.index import index_document_id  # noqa
from aleph.logic import reindex_entities, analyze_collection  # noqa
from aleph.logic import check_alerts  # noqa
from aleph.crawlers import execute_crawler  # noqa
from aleph.events import save_event  # noqa

flask_app = create_app()
