from aleph.core import create_app, celery as app  # noqa

from aleph.ingest import ingest  # noqa
from aleph.analyze import analyze_document_id  # noqa
from aleph.index.documents import index_document_id  # noqa
from aleph.logic.entities import reindex_entities  # noqa
from aleph.logic.alerts import check_alerts  # noqa
from aleph.views.events import save_event  # noqa

flask_app = create_app()
flask_app.app_context().push()
