from aleph.core import create_app, celery as app  # noqa

from aleph.ingest import ingest  # noqa
from aleph.index.documents import index_document_id  # noqa
from aleph.logic.entities import reindex_entities, bulk_load_query  # noqa
from aleph.logic.collections import process_collection, delete_collection  # noqa
from aleph.logic.documents import process_document_id  # noqa
from aleph.logic.xref import process_xref # noqa
from aleph.logic.alerts import check_alerts  # noqa

flask_app = create_app()
flask_app.app_context().push()
