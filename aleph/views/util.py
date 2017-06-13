import StringIO
from apikit import obj_or_404
from flask import request
from urlparse import urlparse, urljoin
from werkzeug.exceptions import NotFound, ImATeapot
import xlsxwriter

from aleph.authz import Authz
from aleph.model import Document
from aleph.logic import fetch_entity


def get_entity(id, action):
    entity, obj = fetch_entity(id)
    if obj is None:
        entity = obj_or_404(entity)
        # Apply roles-based security to dataset-sourced entities.
        request.authz.require(request.authz.check_roles(entity.get('roles')))
        # Cannot edit them:
        if action == request.authz.WRITE:
            raise ImATeapot("Cannot write this entity.")
    else:
        collections = request.authz.collections.get(action)
        request.authz.require(obj.collection_id in collections)
    return entity, obj


def get_document(document_id, action=Authz.READ):
    document = Document.by_id(document_id)
    if document is None:
        raise NotFound()
    collections = request.authz.collections.get(action)
    request.authz.require(document.collection_id in collections)
    return document


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
            val = data.get(field) or ''
            if isinstance(val, (list, tuple, set)):
                val = ', '.join(val)
            worksheet.write_string(row, col, val)
            col += 1
        row += 1

    worksheet.freeze_panes(1, 0)
    workbook.close()
    output.seek(0)
    return output


def extract_next_url(req):
    """Extracts the URL/path to follow when redirects/unauthorization occurs.

    :param object req: Flask request object to extract from.
    :return: Path of the next target URL.
    :rtype: str
    """
    next_url = '/'

    for target in req.args.get('next'), req.referrer:
        if not target:
            continue
        if is_safe_url(target):
            next_url = target

    return next_url
