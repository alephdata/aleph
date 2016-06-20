import os
import json
from flask import Blueprint, request
from werkzeug import secure_filename
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, jsonify

from aleph import authz
from aleph.metadata import Metadata
from aleph.ingest import ingest_file
from aleph.core import get_upload_folder
from aleph.model import Collection


blueprint = Blueprint('ingest_api', __name__)


@blueprint.route('/api/1/collections/<int:collection_id>/ingest',
                 methods=['POST', 'PUT'])
def ingest_upload(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    authz.require(authz.collection_write(collection.id))
    try:
        meta = json.loads(request.form.get('meta', '{}'))
    except Exception as ex:
        raise BadRequest(unicode(ex))

    metas = []
    for storage in request.files.values():
        # TODO: metadata validation.
        file_meta = Metadata(data=meta.copy())
        sec_fn = os.path.join(get_upload_folder(),
                              secure_filename(storage.filename))
        storage.save(sec_fn)
        file_meta.mime_type = storage.mimetype
        file_meta.file_name = storage.filename
        ingest_file(collection.id, file_meta, sec_fn, move=True)
        metas.append(file_meta)
    return jsonify({'status': 'ok', 'metadata': metas})
