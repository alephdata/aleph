import io
import csv
import logging
from banal import as_bool
from normality import stringify
from flask import Response, request, render_template
from flask_babel import gettext
from werkzeug.urls import url_parse, url_join
from werkzeug.exceptions import MethodNotAllowed, Forbidden
from werkzeug.exceptions import BadRequest, NotFound
from lxml.etree import tostring
from lxml.html import document_fromstring
from lxml.html.clean import Cleaner
from servicelayer.jobs import Job

from aleph.authz import Authz
from aleph.model import Collection, Entity
from aleph.validation import get_validator
from aleph.index.entities import get_entity as _get_index_entity
from aleph.index.collections import get_collection as _get_index_collection
from aleph.util import JSONEncoder

log = logging.getLogger(__name__)


def require(*predicates):
    """Check if a user is allowed a set of predicates."""
    for predicate in predicates:
        if not predicate:
            raise Forbidden("Sorry, you're not permitted to do this!")


def obj_or_404(obj):
    """Raise a 404 error if the given object is None."""
    if obj is None:
        raise NotFound()
    return obj


def get_flag(name, default=False):
    return as_bool(request.args.get(name), default=default)


def get_session_id():
    role_id = stringify(request.authz.id) or 'anonymous'
    session_id = None
    if hasattr(request, '_session_id'):
        session_id = stringify(request._session_id)
    session_id = session_id or Job.random_id()
    return '%s:%s' % (role_id, session_id)


def parse_request(schema):
    """Get request form data or body and validate it against a schema."""
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict(flat=True)
    return validate(data, schema)


def validate(data, schema):
    """Validate the data inside a request against a schema."""
    validator = get_validator(schema)
    errors = {}
    for error in validator.iter_errors(data):
        path = '.'.join(error.path)
        errors[path] = error.message

    if not len(errors):
        return data

    resp = jsonify({
        'status': 'error',
        'errors': errors,
        'message': gettext('Error during data validation')
    }, status=400)
    raise BadRequest(response=resp)


def get_db_entity(entity_id, action=Authz.READ):
    get_index_entity(entity_id, action=action)
    entity = Entity.by_id(entity_id)
    if entity is None:
        raise MethodNotAllowed(description="Cannot write this entity")
    return entity


def get_index_entity(entity_id, action=Authz.READ):
    entity = obj_or_404(_get_index_entity(entity_id))
    require(request.authz.can(entity['collection_id'], action))
    return entity


def get_db_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(Collection.by_id(collection_id))
    require(request.authz.can(collection.id, action))
    return collection


def get_index_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(_get_index_collection(collection_id))
    require(request.authz.can(collection['id'], action))
    return collection


def get_url_path(url):
    try:
        return url_parse(url).replace(netloc='', scheme='').to_url() or '/'
    except Exception:
        return '/'


CLEANER = Cleaner(
    style=True,
    meta=True,
    links=False,
    remove_tags=['body', 'form'],
    kill_tags=['area', 'audio', 'base', 'bgsound', 'embed', 'frame',
               'frameset', 'head', 'img', 'iframe', 'input', 'link',
               'map', 'meta', 'nav', 'object', 'plaintext', 'track',
               'video']
)


def sanitize_html(html_text, base_url):
    """Remove anything from the given HTML that must not show up in the UI."""
    # TODO: circumvent encoding declarations?
    if html_text is None or not len(html_text.strip()):
        return
    try:
        cleaned = CLEANER.clean_html(html_text)
        html = document_fromstring(cleaned)
        for (el, attr, href, _) in html.iterlinks():
            href = normalize_href(href, base_url)
            if href is not None:
                el.set(attr, href)
            if el.tag == 'a':
                el.set('target', '_blank')
                rel = set(el.get('rel', '').lower().split())
                rel.update(['nofollow', 'noreferrer', 'external', 'noopener'])
                el.set('rel', ' '.join(rel))
        return tostring(html)
    except Exception:
        log.exception("HTML sanitizer failure")
        return gettext("[HTML removed: could not be sanitized]")


def normalize_href(href, base_url):
    # Make links relative to the source_url
    href = stringify(href)
    if href is None:
        return
    if base_url is not None:
        return url_join(base_url, href)
    try:
        parsed = url_parse(href)
        if not parsed.netloc:
            return None
        return href
    except ValueError:
        return None


def jsonify(obj, status=200, headers=None, encoder=JSONEncoder):
    """Serialize to JSON and also dump from the given schema."""
    data = encoder().encode(obj)
    mimetype = 'application/json'
    if 'callback' in request.args:
        cb = request.args.get('callback')
        data = '%s && %s(%s)' % (cb, cb, data)
        # mime cf. https://stackoverflow.com/questions/24528211/
        mimetype = 'application/javascript'
    return Response(data,
                    headers=headers,
                    status=status,
                    mimetype=mimetype)


def stream_ijson(iterable, encoder=JSONEncoder):
    """Stream JSON line-based data."""
    def _generate_stream():
        for row in iterable:
            row.pop('_index', None)
            yield encoder().encode(row)
            yield '\n'
    return Response(_generate_stream(), mimetype='application/json+stream')


def stream_csv(iterable):
    """Stream JSON line-based data."""
    def _generate_stream():
        for row in iterable:
            values = []
            for value in row:
                values.append(stringify(value) or '')
            buffer = io.StringIO()
            writer = csv.writer(buffer, dialect='excel', delimiter=',')
            writer.writerow(values)
            yield buffer.getvalue()
    return Response(_generate_stream(), mimetype='text_csv')


def render_xml(template, **kwargs):
    data = render_template(template, **kwargs)
    return Response(data, mimetype='text/xml')
