import StringIO
from flask import request
from urlparse import urlparse, urljoin
from werkzeug.exceptions import NotFound
import xlsxwriter

from aleph.core import db
from aleph.authz import Authz
from aleph.model import Document, DocumentPage


def get_document(document_id, action=Authz.READ):
    document = Document.by_id(document_id)
    if document is None:
        raise NotFound()
    collections = request.authz.collections.get(action)
    request.authz.require(document.collection_id in collections)
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
        raise NotFound("No such page: %s" % number)
    return document, page


def is_safe_url(target):
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ('http', 'https') and \
        ref_url.netloc == test_url.netloc


def make_excel(result_iter, fields):
    output = StringIO.StringIO()
    workbook = xlsxwriter.Workbook(output)
    worksheet = workbook.add_worksheet('Documents')

    header = workbook.add_format({
        'bold': True,
        'border': 1,
        'fg_color': '#D7E4BC'
    })
    col = 0
    for field in fields:
        field = field.replace('_', ' ').capitalize()
        worksheet.write(0, col, field, header)
        col += 1
    row = 1
    for data in result_iter:
        col = 0
        for field in fields:
            val = data.get(field, '')
            if isinstance(val, (list, tuple, set)):
                val = ', '.join(val)
            worksheet.write(row, col, val)
            col += 1
        row += 1

    worksheet.freeze_panes(1, 0)
    workbook.close()
    output.seek(0)
    return output
