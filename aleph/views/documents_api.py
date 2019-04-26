import logging
from flask import Blueprint, request

from aleph.logic.documents import delete_document
from aleph.views.util import get_db_document

log = logging.getLogger(__name__)
blueprint = Blueprint('documents_api', __name__)


@blueprint.route('/api/2/documents/<document_id>', methods=['DELETE'])
def delete(document_id):
    document = get_db_document(document_id, request.authz.WRITE)
    delete_document(document, sync=True)
    return ('', 204)
