from flask import request
from werkzeug.exceptions import NotFound, BadRequest

from aleph import authz
from aleph.model import Document


def get_document(document_id):
    document = Document.by_id(document_id)
    if document is None:
        raise NotFound()
    authz.require(authz.source_read(document.source_id))
    return document


def match_ids(arg_name, valid_ids):
    filter_lists = [int(f) for f in request.args.getlist(arg_name)]
    if len(filter_lists):
        try:
            valid_ids = [l for l in valid_ids if l in filter_lists]
        except ValueError:
            raise BadRequest()
    return valid_ids
