import logging
from werkzeug.exceptions import BadRequest, NotFound
from flask import Blueprint, redirect, send_file, request

from aleph.core import archive, db
from aleph.model import Document, DocumentRecord
from aleph.logic.documents import update_document, delete_document
from aleph.logic.collections import update_collection
from aleph.views.cache import enable_cache
from aleph.views.util import get_document, jsonify, parse_request
from aleph.views.serializers import DocumentSchema, RecordSchema
from aleph.search import DocumentsQuery, RecordsQuery
from aleph.util import PDF_MIME


log = logging.getLogger(__name__)
blueprint = Blueprint('documents_api', __name__)


@blueprint.route('/api/2/documents', methods=['GET'])
def index():
    enable_cache()
    result = DocumentsQuery.handle_request(request, schema=DocumentSchema)
    return jsonify(result)


@blueprint.route('/api/2/documents/<int:document_id>')
def view(document_id):
    enable_cache()
    document = get_document(document_id)
    return jsonify(document, schema=DocumentSchema)


@blueprint.route('/api/2/documents/<int:document_id>', methods=['POST', 'PUT'])
def update(document_id):
    document = get_document(document_id, request.authz.WRITE)
    data = parse_request(schema=DocumentSchema)
    document.update(data)
    db.session.commit()
    update_document(document)
    return view(document_id)


@blueprint.route('/api/2/documents/<int:document_id>', methods=['DELETE'])
def delete(document_id):
    document = get_document(document_id, request.authz.WRITE)
    delete_document(document)
    update_collection(document.collection)
    return jsonify({'status': 'ok'}, status=410)


def _serve_archive(content_hash, file_name, mime_type):
    """Serve a file from the archive or by generating an external URL."""
    url = archive.generate_url(content_hash,
                               file_name=file_name,
                               mime_type=mime_type)
    if url is not None:
        return redirect(url)

    enable_cache()
    local_path = archive.load_file(content_hash, file_name=file_name)
    if local_path is None:
        raise NotFound("File does not exist.")

    return send_file(open(local_path, 'rb'),
                     as_attachment=True,
                     attachment_filename=file_name,
                     mimetype=mime_type)


@blueprint.route('/api/2/documents/<int:document_id>/file')
def file(document_id):
    document = get_document(document_id)
    return _serve_archive(document.content_hash,
                          document.file_name,
                          document.mime_type)


@blueprint.route('/api/2/documents/<int:document_id>/pdf')
def pdf(document_id):
    document = get_document(document_id)
    if document.type != Document.TYPE_TEXT:
        raise BadRequest("PDF is only available for text documents")
    return _serve_archive(document.pdf_version,
                          document.file_name,
                          PDF_MIME)


@blueprint.route('/api/2/documents/<int:document_id>/records')
def records(document_id):
    enable_cache()
    document = get_document(document_id)
    result = RecordsQuery.handle_request(request, document=document,
                                         schema=RecordSchema)
    return jsonify(result)


@blueprint.route('/api/2/documents/<int:document_id>/records/<int:index>')
def record(document_id, index):
    enable_cache()
    document = get_document(document_id)
    record = DocumentRecord.by_index(document.id, index)
    if record is None:
        raise NotFound("No such record: %s" % index)
    return jsonify(record, schema=RecordSchema)
