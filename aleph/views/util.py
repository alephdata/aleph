import StringIO
from apikit import jsonify as jsonify_
from apikit import obj_or_404
from flask import request
from urlparse import urlparse, urljoin
from werkzeug.exceptions import ImATeapot, Forbidden, BadRequest
import xlsxwriter

from aleph.authz import Authz
from aleph.model import Document, Collection
from aleph.logic import fetch_entity


def require(*predicates):
    """Check if a user is allowed a set of predicates."""
    for predicate in predicates:
        if not predicate:
            raise Forbidden("Sorry, you're not permitted to do this!")


def jsonify(obj, schema=None, status=200, **kwargs):
    """Serialize to JSON and also dump from the given schema."""
    if schema is not None:
        obj, _ = schema().dump(obj)
    return jsonify_(obj, status=status, **kwargs)


def validate_data(data, schema):
    """Validate the data inside a request against a schema."""
    # from pprint import pprint
    # pprint(data)
    data, errors = schema().load(data)
    if len(errors):
        raise BadRequest(response=jsonify({
            'status': 'error',
            'errors': errors
        }, status=400))


def parse_request(schema=None):
    """Get request form data or body and validate it against a schema."""
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict(flat=True)
    if schema is not None:
        validate_data(data, schema)
    return data


def get_entity(id, action):
    entity, obj = fetch_entity(id)
    obj_or_404(entity)
    if entity.get('$bulk') and action == request.authz.WRITE:
        raise ImATeapot("Cannot write this entity.")
    require(request.authz.can(entity.get('collection_id'), action))
    return entity, obj


def get_document(document_id, action=Authz.READ):
    document = obj_or_404(Document.by_id(document_id))
    require(request.authz.can(document.collection_id, action))
    return document


def get_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(Collection.by_id(collection_id))
    require(request.authz.can(collection.id, action))
    return collection


def is_safe_url(target):
    """Check if the forward URL is on the same host as the site."""
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))
    return test_url.scheme in ('http', 'https') and \
        ref_url.netloc == test_url.netloc


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