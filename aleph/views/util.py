import logging
from banal import as_bool, ensure_dict
from normality import stringify
from flask import request, jsonify
from flask_babel import gettext
from werkzeug.urls import url_parse
from werkzeug.exceptions import Forbidden
from werkzeug.exceptions import BadRequest, NotFound
from servicelayer.jobs import Job

from aleph.authz import Authz
from aleph.model import Collection, EntitySet
from aleph.validation import get_validator
from aleph.index.entities import get_entity as _get_index_entity
from aleph.index.collections import get_collection as _get_index_collection

log = logging.getLogger(__name__)


def obj_or_404(obj):
    """Raise a 404 error if the given object is None."""
    if obj is None:
        raise NotFound()
    return obj


def get_flag(name, default=False):
    return as_bool(request.args.get(name), default=default)


def get_session_id():
    role_id = stringify(request.authz.id) or "anonymous"
    session_id = stringify(request._session_id)
    session_id = session_id or Job.random_id()
    return "%s:%s" % (role_id, session_id)


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
        path = ".".join((str(c) for c in error.path))
        if path not in errors:
            errors[path] = error.message
        else:
            errors[path] += "; " + error.message
        log.info("ERROR [%s]: %s", path, error.message)

    if not len(errors):
        return data

    resp = jsonify(
        {
            "status": "error",
            "errors": errors,
            "message": gettext("Error during data validation"),
        },
        status=400,
    )
    raise BadRequest(response=resp)


def is_permitted_or_403(*predicates):
    """Check if a user is allowed a set of predicates."""
    for predicate in predicates:
        if not predicate:
            raise Forbidden("Sorry, you're not permitted to do this!")


def get_index_entity(entity_id, action=Authz.READ, **kwargs):
    entity = obj_or_404(_get_index_entity(entity_id, **kwargs))
    is_permitted_or_403(request.authz.can(entity["collection_id"], action))
    return entity


def get_db_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(Collection.by_id(collection_id))
    is_permitted_or_403(request.authz.can(collection.id, action))
    return collection


def get_entityset(entityset_id, action=Authz.READ):
    eset = obj_or_404(EntitySet.by_id(entityset_id))
    is_permitted_or_403(request.authz.can(eset.collection_id, action))
    return eset


def get_index_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(_get_index_collection(collection_id))
    is_permitted_or_403(request.authz.can(collection["id"], action))
    return collection


def get_nested(data, obj_field, id_field):
    collection = ensure_dict(data.get(obj_field))
    return data.get(id_field, collection.get("id"))


def get_nested_collection(data, action=Authz.READ):
    collection_id = get_nested(data, "collection", "collection_id")
    return get_db_collection(collection_id, action)


def get_url_path(url):
    try:
        return url_parse(url).replace(netloc="", scheme="").to_url() or "/"
    except Exception:
        return "/"

