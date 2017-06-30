import os
import json
from flask import Blueprint, request
from werkzeug import secure_filename
from werkzeug.exceptions import BadRequest
from apikit import obj_or_404, jsonify

from aleph.core import upload_folder
from aleph.ingest import ingest_document
from aleph.model import Collection, Document
from aleph.model.common import make_textid
from aleph.model.validate import validate
from aleph.views.util import require
from aleph.util import checksum


blueprint = Blueprint('ingest_api', __name__)


@blueprint.route('/api/2/collections/<int:id>/ingest', methods=['POST', 'PUT'])
def ingest_upload(id):
    collection = obj_or_404(Collection.by_id(id))
    require(request.authz.can_write(collection.id))
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
        document.crawler = 'user_upload:%s' % request.authz.id
        document.crawler_run = crawler_run
        document.mime_type = storage.mimetype
        document.file_name = storage.filename

        try:
            meta = json.loads(request.form.get('meta', '{}'))
            validate(meta, 'metadata.json#')
            document.meta.update(meta)
        except Exception as ex:
            raise BadRequest(unicode(ex))

        ingest_document(document, sec_fn, role_id=request.authz.id)
        os.unlink(sec_fn)
        documents.append(document)
    return jsonify({
        'status': 'ok',
        'documents': documents
    })
