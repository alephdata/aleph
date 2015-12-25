from werkzeug.exceptions import NotFound
from flask import Blueprint, redirect, send_file
from apikit import jsonify


from aleph.core import archive
from aleph import authz
from aleph.model import Document

blueprint = Blueprint('data', __name__)


def get_document(document_id):
    document = Document.by_id(document_id)
    if document is None:
        raise NotFound()
    authz.require(authz.source_read(document.source_id))
    return document


@blueprint.route('/api/1/document/<document_id>')
def document(document_id):
    return jsonify(get_document(document_id).to_dict())


@blueprint.route('/api/1/document/<document_id>/file')
def file(document_id):
    document = get_document(document_id)
    url = archive.generate_url(document.meta)
    if url is not None:
        return redirect(url)

    local_path = archive.load_file(document.meta)
    fh = open(local_path, 'rb')
    return send_file(fh, as_attachment=True,
                     attachment_filename=document.meta.file_name,
                     mimetype=document.meta.mime_type)
