import os
import json
from flask import Blueprint, request
from werkzeug import secure_filename
from werkzeug.exceptions import BadRequest
from storagelayer import checksum

from aleph.core import upload_folder
from aleph.ingest import ingest_document
from aleph.model import Collection, Document
from aleph.views.serializers import DocumentSchema
from aleph.views.util import require, obj_or_404, jsonify, validate_data


blueprint = Blueprint('ingest_api', __name__)


@blueprint.route('/api/2/collections/<int:id>/ingest', methods=['POST', 'PUT'])
def ingest_upload(id):
    collection = obj_or_404(Collection.by_id(id))
    require(request.authz.can_write(collection.id))

    try:
        meta = json.loads(request.form.get('meta', '{}'))
    except Exception as ex:
        raise BadRequest(unicode(ex))
    validate_data(meta, DocumentSchema)

    documents = []
    for storage in request.files.values():
        sec_fn = os.path.join(upload_folder, secure_filename(storage.filename))
        storage.save(sec_fn)
        content_hash = checksum(sec_fn)
        document = Document.by_keys(collection=collection,
                                    content_hash=content_hash)
        document.mime_type = storage.mimetype
        document.file_name = storage.filename
        document.update(meta)
        ingest_document(document, sec_fn, role_id=request.authz.id)
        os.unlink(sec_fn)
        documents.append(document)

    return jsonify({
        'status': 'ok',
        'documents': [DocumentSchema().dump(d).data for d in documents]
    })
