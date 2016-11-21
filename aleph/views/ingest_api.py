import os
import json
from flask import Blueprint, request
from werkzeug import secure_filename
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, jsonify

from aleph import authz
from aleph.core import upload_folder, USER_QUEUE, USER_ROUTING_KEY
from aleph.events import log_event
from aleph.metadata import Metadata
from aleph.ingest import ingest_file
from aleph.model import Collection, validate
from aleph.model.common import make_textid


blueprint = Blueprint('ingest_api', __name__)


@blueprint.route('/api/1/collections/<int:collection_id>/ingest',
                 methods=['POST', 'PUT'])
def ingest_upload(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    authz.require(authz.collection_write(collection.id))
    log_event(request)
    try:
        meta = json.loads(request.form.get('meta', '{}'))
    except Exception as ex:
        raise BadRequest(unicode(ex))

    metas = []
    for storage in request.files.values():
        file_meta = meta.copy()
        file_meta['mime_type'] = storage.mimetype
        file_meta['file_name'] = storage.filename
        validate(file_meta, 'metadata.json#')
        file_meta = Metadata.from_data(file_meta)
        file_meta.crawler_id = 'user_upload:%s' % request.auth_role.id
        file_meta.crawler_run = make_textid()
        sec_fn = os.path.join(upload_folder, secure_filename(storage.filename))
        storage.save(sec_fn)
        ingest_file(collection.id, file_meta, sec_fn, move=True,
                    queue=USER_QUEUE, routing_key=USER_ROUTING_KEY)
        metas.append(file_meta)
    return jsonify({'status': 'ok', 'metadata': metas})
