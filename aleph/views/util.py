from flask import request
from werkzeug.exceptions import NotFound, BadRequest

from aleph import authz
from aleph.core import db
from aleph.model import Document, DocumentPage


def get_document(document_id):
    document = Document.by_id(document_id)
    if document is None:
        raise NotFound()
    authz.require(authz.source_read(document.source_id))
    return document


def get_tabular(document_id, table_id):
    document = get_document(document_id)
    try:
        table = document.meta.tables[table_id]
    except IndexError:
        raise NotFound("No such table: %s" % table_id)
    return document, table


def get_page(document_id, number):
    document = get_document(document_id)
    q = db.session.query(DocumentPage)
    q = q.filter(DocumentPage.document_id == document_id)
    q = q.filter(DocumentPage.number == number)
    page = q.first()
    if page is None:
        raise NotFound("No such page: %s" % page)
    return document, page


def match_ids(arg_name, valid_ids):
    filter_lists = [int(f) for f in request.args.getlist(arg_name)]
    if len(filter_lists):
        try:
            valid_ids = [l for l in valid_ids if l in filter_lists]
        except ValueError:
            raise BadRequest()
    return valid_ids
