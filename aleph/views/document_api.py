from werkzeug.exceptions import NotFound, BadRequest
from flask import Blueprint, redirect, send_file
from apikit import jsonify


from aleph.core import archive
from aleph import authz
from aleph.model import Document
from aleph.views.cache import enable_cache

blueprint = Blueprint('document', __name__)


def get_document(document_id):
    document = Document.by_id(document_id)
    if document is None:
        raise NotFound()
    authz.require(authz.source_read(document.source_id))
    return document


@blueprint.route('/api/1/documents/<int:document_id>')
def view(document_id):
    doc = get_document(document_id)
    enable_cache()
    data = doc.to_dict()
    data['source'] = doc.source
    return jsonify(data)


@blueprint.route('/api/1/documents/<int:document_id>/file')
def file(document_id):
    document = get_document(document_id)
    enable_cache(server_side=True)
    url = archive.generate_url(document.meta)
    if url is not None:
        return redirect(url)

    local_path = archive.load_file(document.meta)
    fh = open(local_path, 'rb')
    return send_file(fh, as_attachment=True,
                     attachment_filename=document.meta.file_name,
                     mimetype=document.meta.mime_type)


@blueprint.route('/api/1/documents/<int:document_id>/pdf')
def pdf(document_id):
    document = get_document(document_id)
    enable_cache(server_side=True)
    if document.type != Document.TYPE_TEXT:
        raise BadRequest("PDF is only available for text documents")
    pdf = document.meta.pdf
    url = archive.generate_url(pdf)
    if url is not None:
        return redirect(url)

    local_path = archive.load_file(pdf)
    fh = open(local_path, 'rb')
    return send_file(fh, mimetype=pdf.mime_type)
