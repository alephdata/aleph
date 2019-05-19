from aleph.core import create_app, celery as app  # noqa
from aleph.logic.documents import ingest, process_documents  # noqa
from aleph.logic.entities.xref import xref_collection # noqa

flask_app = create_app()
flask_app.app_context().push()
