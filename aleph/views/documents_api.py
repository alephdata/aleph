import logging
from werkzeug.exceptions import BadRequest, NotFound
from flask import Blueprint, redirect, send_file, request
from apikit import jsonify, request_data

from aleph.core import archive, url_for, db
from aleph.model import Document, DocumentRecord
from aleph.logic.documents import update_document, delete_document
from aleph.logic.collections import update_collection
from aleph.events import log_event
from aleph.views.cache import enable_cache
from aleph.views.util import get_document
from aleph.search import DocumentsQuery, RecordsQuery
from aleph.util import PDF_MIME


log = logging.getLogger(__name__)
blueprint = Blueprint('documents_api', __name__)


@blueprint.route('/api/2/documents', methods=['GET'])
def index():
    result = DocumentsQuery.handle_request(request)
    return jsonify(result)


@blueprint.route('/api/2/documents/<int:document_id>')
def view(document_id):
    doc = get_document(document_id)
    data = doc.to_dict()
    if doc.parent is not None:
        data['parent'] = doc.parent.to_dict()
    log_event(request, document_id=doc.id)
    data['data_url'] = archive.generate_url(doc.content_hash)
    if data['data_url'] is None:
        data['data_url'] = url_for('documents_api.file',
                                   document_id=document_id)
    if doc.pdf_version:
        data['pdf_url'] = url_for('documents_api.pdf',
                                  document_id=document_id)
    return jsonify(data)


@blueprint.route('/api/2/documents/<int:document_id>', methods=['POST', 'PUT'])
def update(document_id):
    document = get_document(document_id, request.authz.WRITE)
    data = request_data()
    document.update(data)
    db.session.commit()
    log_event(request, document_id=document.id)
    update_document(document)
    return view(document_id)


@blueprint.route('/api/2/documents/<int:document_id>', methods=['DELETE'])
def delete(document_id):
    document = get_document(document_id, request.authz.WRITE)
    delete_document(document)
    update_collection(document.collection)
    log_event(request)
    return jsonify({'status': 'ok'})


@blueprint.route('/api/2/documents/<int:document_id>/file')
def file(document_id):
    document = get_document(document_id)
    log_event(request, document_id=document.id)
    url = archive.generate_url(document.content_hash,
                               file_name=document.file_name,
                               mime_type=document.mime_type)
    if url is not None:
        return redirect(url)

    enable_cache()
    local_path = archive.load_file(document.content_hash,
                                   file_name=document.file_name)
    if local_path is None:
        raise NotFound("File does not exist.")

    fh = open(local_path, 'rb')
    return send_file(fh, as_attachment=True,
                     attachment_filename=document.file_name,
                     mimetype=document.mime_type)


@blueprint.route('/api/2/documents/<int:document_id>/pdf')
def pdf(document_id):
    document = get_document(document_id)
    log_event(request, document_id=document.id)
    if document.type != Document.TYPE_TEXT:
        raise BadRequest("PDF is only available for text documents")
    url = archive.generate_url(document.pdf_version, mime_type=PDF_MIME)
    if url is not None:
        return redirect(url)

    enable_cache()
    path = archive.load_file(document.pdf_version,
                             file_name=document.file_name)
    if path is None:
        raise NotFound("Missing PDF file.")
    return send_file(open(path, 'rb'), mimetype=PDF_MIME)


@blueprint.route('/api/2/documents/<int:document_id>/tables/<int:table_id>')
def table(document_id, table_id):
    enable_cache()
    document = get_document(document_id)
    try:
        return jsonify(document.tables[table_id])
    except IndexError:
        raise NotFound("No such table: %s" % table_id)


@blueprint.route('/api/2/documents/<int:document_id>/records')
def records(document_id):
    enable_cache()
    document = get_document(document_id)
    result = RecordsQuery.handle_request(request, document=document)
    return jsonify(result)


@blueprint.route('/api/2/documents/<int:document_id>/records/<int:index>')
def record(document_id, index):
    enable_cache()
    document = get_document(document_id)
    q = db.session.query(DocumentRecord)
    q = q.filter(DocumentRecord.document_id == document.id)
    q = q.filter(DocumentRecord.index == index)
    record = q.first()
    if record is None:
        raise NotFound("No such record: %s" % index)
    return jsonify(record)
