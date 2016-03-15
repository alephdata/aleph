from werkzeug.exceptions import BadRequest
from flask import Blueprint, redirect, send_file, request
from apikit import jsonify, Pager


from aleph.core import archive, db
from aleph import authz
from aleph.model import Document
from aleph.views.cache import enable_cache
from aleph.views.util import get_document, match_ids

blueprint = Blueprint('document', __name__)


@blueprint.route('/api/1/documents', methods=['GET'])
def index():
    q = db.session.query(Document)
    sources_ids = match_ids('sources', authz.sources(authz.READ))
    q = q.filter(Document.source_id.in_(sources_ids))
    hashes = request.args.getlist('content_hash')
    if len(hashes):
        q = q.filter(Document.content_hash.in_(hashes))
    return jsonify(Pager(q))


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
