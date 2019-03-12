from aleph.core import create_app, celery as app  # noqa
from aleph.logic.entities import bulk_load_query  # noqa
from aleph.logic.collections import delete_collection_content  # noqa
from aleph.logic.documents import ingest, process_documents  # noqa
from aleph.logic.scheduled import hourly, daily  # noqa
from aleph.logic.entities.xref import xref_collection # noqa
from aleph.logic.alerts import check_alerts  # noqa
from aleph.logic.audit import record_audit_task  # noqa


flask_app = create_app()
flask_app.app_context().push()
