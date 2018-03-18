import six
import json
import types
from hashlib import sha1
from datetime import datetime, date
from flask import Response, request
from flask_babel.speaklater import LazyString
from normality import stringify
from urlparse import urlparse, urljoin
from werkzeug.exceptions import MethodNotAllowed, Forbidden
from werkzeug.exceptions import BadRequest, NotFound
from lxml.etree import tostring
from lxml.html import document_fromstring
from lxml.html.clean import Cleaner

from aleph.core import settings
from aleph.authz import Authz
from aleph.model import Document, Collection, Entity
from aleph.index.documents import get_entity as _get_index_entity
from aleph.index.collections import get_collection as _get_index_collection


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


def validate_data(data, schema, many=None):
    """Validate the data inside a request against a schema."""
    # from pprint import pprint
    # pprint(data)
    data, errors = schema().load(data, many=many)
    if not len(errors):
        return data
    message = None
    for field, errors in errors.items():
        for error in errors:
            message = error
    raise BadRequest(response=jsonify({
        'status': 'error',
        'errors': errors,
        'message': message
    }, status=400))


def parse_request(schema, many=None):
    """Get request form data or body and validate it against a schema."""
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict(flat=True)
    return validate_data(data, schema, many=many)


def get_db_entity(entity_id, action=Authz.READ):
    get_index_entity(entity_id, action=action)
    entity = Entity.by_id(entity_id)
    if entity is None:
        raise MethodNotAllowed("Cannot write this entity")
    return entity


def get_index_entity(entity_id, action=Authz.READ):
    entity = obj_or_404(_get_index_entity(entity_id))
    require(request.authz.can(entity['collection_id'], action))
    return entity


def get_db_document(document_id, action=Authz.READ):
    document = obj_or_404(Document.by_id(document_id))
    require(request.authz.can(document.collection_id, action))
    return document


def get_index_document(document_id, action=Authz.READ):
    return get_index_entity(document_id, action=action)


def get_db_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(Collection.by_id(collection_id))
    require(request.authz.can(collection.id, action))
    return collection


def get_index_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(_get_index_collection(collection_id))
    require(request.authz.can(collection['id'], action))
    return collection


def is_safe_url(target):
    """Check if the forward URL is on the same host as the site."""
    test_url = urlparse(target)
    return test_url.scheme in ('http', 'https') and \
        urlparse(settings.APP_UI_URL).hostname == test_url.hostname


def get_best_next_url(*urls):
    """Returns the safest URL to redirect to from a given list."""
    for url in urls:
        url = urljoin(settings.APP_UI_URL, url)
        if url and is_safe_url(url):
            return url
    return settings.APP_UI_URL


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
    if html_text is None:
        return
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


def normalize_href(href, base_url):
    # Make links relative to the source_url
    href = stringify(href)
    if href is None:
        return
    if base_url is not None:
        return urljoin(base_url, href)
    try:
        parsed = urlparse(href)
        if not parsed.netloc:
            return None
        return href
    except Exception:
        return None


def cache_hash(*a, **kw):
    """ Try to hash an arbitrary object for caching. """

    def cache_str(o):
        if isinstance(o, (types.FunctionType, types.BuiltinFunctionType,
                          types.MethodType, types.BuiltinMethodType,
                          types.UnboundMethodType)):
            return getattr(o, 'func_name', 'func')
        if isinstance(o, dict):
            o = [k + ':' + cache_str(v) for k, v in o.items()]
        if isinstance(o, (list, tuple, set)):
            o = sorted(map(cache_str, o))
            o = '|'.join(o)
        if isinstance(o, basestring):
            return o
        if hasattr(o, 'updated_at'):
            return cache_str((repr(o), o.updated_at))
        return repr(o)

    hash = cache_str((a, kw)).encode('utf-8')
    return sha1(hash).hexdigest()


class JSONEncoder(json.JSONEncoder):
    """ This encoder will serialize all entities that have a to_dict
    method by calling that method and serializing the result. """

    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, LazyString):
            return six.text_type(obj)
        if isinstance(obj, set):
            return [o for o in obj]
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        return json.JSONEncoder.default(self, obj)


def jsonify(obj, schema=None, status=200, headers=None, encoder=JSONEncoder):
    """Serialize to JSON and also dump from the given schema."""
    if schema is not None:
        obj, _ = schema().dump(obj)
    data = encoder().encode(obj)
    if 'callback' in request.args:
        cb = request.args.get('callback')
        data = '%s && %s(%s)' % (cb, cb, data)
    return Response(data, headers=headers,
                    status=status,
                    mimetype='application/json')