import json
import shutil
import logging
from flask import Blueprint, request
from tempfile import mkdtemp
from werkzeug.exceptions import BadRequest
from normality import safe_filename, stringify
from servicelayer.archive.util import ensure_path

from aleph.core import db, archive
from aleph.model import Document
from aleph.queues import ingest_entity
from aleph.views.util import get_db_collection, get_flag
from aleph.views.util import jsonify, validate_data, get_session_id
from aleph.views.forms import DocumentCreateSchema

log = logging.getLogger(__name__)
blueprint = Blueprint('ingest_api', __name__)


def _load_parent(collection, meta):
    """Determine the parent document for the document that is to be
    ingested."""
    parent_id = meta.get('parent_id')
    if parent_id is None:
        return
    parent = Document.by_id(parent_id, collection_id=collection.id)
    if parent is None:
        raise BadRequest(response=jsonify({
            'status': 'error',
            'message': 'Cannot load parent document'
        }, status=400))
    return parent


def _load_metadata():
    """Unpack the common, pre-defined metadata for all the uploaded files."""
    try:
        meta = json.loads(request.form.get('meta', '{}'))
    except Exception as ex:
        raise BadRequest(str(ex))

    validate_data(meta, DocumentCreateSchema)
    foreign_id = stringify(meta.get('foreign_id'))
    if not len(request.files) and foreign_id is None:
        raise BadRequest(response=jsonify({
            'status': 'error',
            'message': 'Directories need to have a foreign_id'
        }, status=400))
    return meta, foreign_id


@blueprint.route('/api/2/collections/<int:collection_id>/ingest',
                 methods=['POST', 'PUT'])
def ingest_upload(collection_id):
    collection = get_db_collection(collection_id, request.authz.WRITE)
    job_id = get_session_id()
    sync = get_flag('sync', default=False)
    meta, foreign_id = _load_metadata()
    parent = _load_parent(collection, meta)
    upload_dir = ensure_path(mkdtemp(prefix='aleph.upload.'))
    try:
        content_hash = None
        for storage in request.files.values():
            path = safe_filename(storage.filename, default='upload')
            path = upload_dir.joinpath(path)
            storage.save(str(path))
            content_hash = archive.archive_file(path)
        document = Document.save(collection=collection,
                                 parent=parent,
                                 foreign_id=foreign_id,
                                 content_hash=content_hash,
                                 meta=meta,
                                 uploader_id=request.authz.id)
        collection.touch()
        db.session.commit()
        proxy = document.to_proxy()
        ingest_entity(collection, proxy, job_id=job_id, sync=sync)
    finally:
        shutil.rmtree(upload_dir)

    return jsonify({
        'status': 'ok',
        'id': stringify(document.id)
    }, status=201)
