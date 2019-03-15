import os
import json
import shutil
import logging
from flask import Blueprint, request
from tempfile import mkdtemp
from werkzeug.exceptions import BadRequest
from normality import safe_filename, stringify
from servicelayer.archive.util import checksum

from aleph.model import Document
from aleph.logic.documents import ingest_document, update_document
from aleph.views.util import require, get_flag
from aleph.views.util import jsonify, validate_data
from aleph.views.forms import DocumentCreateSchema

log = logging.getLogger(__name__)
blueprint = Blueprint('ingest_api', __name__)


def _load_parent(collection_id, meta):
    """Determine the parent document for the document that is to be
    ingested."""
    parent_id = meta.get('parent_id')
    if parent_id is None:
        return
    parent = Document.by_id(parent_id, collection_id=collection_id)
    if parent is None:
        raise BadRequest(response=jsonify({
            'status': 'error',
            'message': 'Cannot load parent document'
        }, status=400))
    return parent_id


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
    require(request.authz.can(collection_id, request.authz.WRITE))
    sync = get_flag('sync')
    meta, foreign_id = _load_metadata()
    parent_id = _load_parent(collection_id, meta)
    upload_dir = mkdtemp(prefix='aleph.upload.')
    try:
        path = None
        content_hash = None
        for storage in request.files.values():
            path = safe_filename(storage.filename, default='upload')
            path = os.path.join(upload_dir, path)
            storage.save(path)
            content_hash = checksum(path)
        document = Document.by_keys(collection_id=collection_id,
                                    parent_id=parent_id,
                                    foreign_id=foreign_id,
                                    content_hash=content_hash)
        document.update(meta)
        document.schema = Document.SCHEMA
        if content_hash is None:
            document.schema = Document.SCHEMA_FOLDER
        ingest_document(document, path,
                        role_id=request.authz.id,
                        content_hash=content_hash)
    finally:
        shutil.rmtree(upload_dir)
    
    if document.collection.casefile:
        # Make sure collection counts are always accurate.
        update_document(document, sync=sync)
    return jsonify({
        'status': 'ok',
        'id': stringify(document.id)
    }, status=201)
