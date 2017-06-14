import os
import json
from flask import Blueprint, request
from werkzeug import secure_filename
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, jsonify

from aleph.core import upload_folder
from aleph.events import log_event
from aleph.ingest import ingest_document
from aleph.model import Collection, Document
from aleph.model.common import make_textid
from aleph.model.validate import validate
from aleph.util import checksum


blueprint = Blueprint('ingest_api', __name__)


@blueprint.route('/api/1/collections/<int:collection_id>/ingest',
                 methods=['POST', 'PUT'])
def ingest_upload(collection_id):
    collection = obj_or_404(Collection.by_id(collection_id))
    request.authz.require(request.authz.collection_write(collection.id))
    log_event(request)
    crawler_run = make_textid()

    try:
        meta = json.loads(request.form.get('meta', '{}'))
    except Exception as ex:
        raise BadRequest(unicode(ex))

    documents = []
    for storage in request.files.values():
        sec_fn = os.path.join(upload_folder, secure_filename(storage.filename))
        storage.save(sec_fn)
        content_hash = checksum(sec_fn)
        document = Document.by_keys(collection=collection,
                                    content_hash=content_hash)
        document.crawler = 'user_upload:%s' % request.authz.role.id
        document.crawler_run = crawler_run
        document.mime_type = storage.mimetype
        document.file_name = storage.filename

        try:
            meta = json.loads(request.form.get('meta', '{}'))
            validate(meta, 'metadata.json#')
            document.meta.update(meta)
        except Exception as ex:
            raise BadRequest(unicode(ex))

        ingest_document(document, sec_fn, user_queue=True)
        os.unlink(sec_fn)
        documents.append(document)
    return jsonify({'status': 'ok', 'documents': documents})
