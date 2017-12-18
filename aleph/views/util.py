from apikit import jsonify as jsonify_
from apikit import obj_or_404
from flask import request
from urlparse import urlparse, urljoin
from werkzeug.exceptions import MethodNotAllowed, Forbidden, BadRequest

from aleph.core import app_ui_url
from aleph.authz import Authz
from aleph.model import Document, Collection, Entity
from aleph.index.documents import get_entity as _get_index_entity
from aleph.index.collections import get_collection as _get_index_collection


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
        urlparse(app_ui_url).hostname == test_url.hostname


def get_best_next_url(*urls):
    """Returns the safest URL to redirect to from a given list."""
    for url in urls + (app_ui_url,):
        url = urljoin(app_ui_url, url)
        if url and is_safe_url(url):
            return url
