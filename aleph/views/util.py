import io
import csv
import string
import logging
from banal import as_bool, ensure_dict, is_mapping, is_listish
from normality import stringify
from flask import Response, request, render_template
from flask_babel import gettext
from werkzeug.urls import url_parse
from werkzeug.exceptions import Forbidden
from werkzeug.exceptions import BadRequest, NotFound
from servicelayer.jobs import Job

from aleph.authz import Authz
from aleph.model import Collection, EntitySet, Role
from aleph.validation import get_validator
from aleph.index.entities import get_entity as _get_index_entity
from aleph.index.collections import get_collection as _get_index_collection
from aleph.util import JSONEncoder

log = logging.getLogger(__name__)
CALLBACK_VALID = string.ascii_letters + string.digits + "_"


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
    # data = clean_object(data)
    errors = {}
    for error in validator.iter_errors(data):
        path = ".".join((str(c) for c in error.path))
        errors[path] = error.message
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


def clean_object(data):
    """Remove unset values from the response to save some bandwidth."""
    if is_mapping(data):
        out = {}
        for k, v in data.items():
            v = clean_object(v)
            if v is not None:
                out[k] = v
        return out if len(out) else None
    elif is_listish(data):
        data = [clean_object(d) for d in data]
        data = [d for d in data if d is not None]
        return data if len(data) else None
    elif isinstance(data, str):
        return data if len(data) else None
    return data


def get_index_entity(entity_id, action=Authz.READ, **kwargs):
    entity = obj_or_404(_get_index_entity(entity_id, **kwargs))
    require(request.authz.can(entity["collection_id"], action))
    return entity


def get_db_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(Collection.by_id(collection_id))
    require(request.authz.can(collection.id, action))
    return collection


def get_entityset(entityset_id, action=Authz.READ):
    eset = obj_or_404(EntitySet.by_id(entityset_id))
    require(request.authz.can(eset.collection_id, action))
    return eset


def get_nested(data, obj_field, id_field):
    collection = ensure_dict(data.get(obj_field))
    return data.get(id_field, collection.get("id"))


def get_nested_collection(data, action=Authz.READ):
    collection_id = get_nested(data, "collection", "collection_id")
    return get_db_collection(collection_id, action)


def get_index_collection(collection_id, action=Authz.READ):
    collection = obj_or_404(_get_index_collection(collection_id))
    require(request.authz.can(collection["id"], action))
    return collection


def get_url_path(url):
    try:
        return url_parse(url).replace(netloc="", scheme="").to_url() or "/"
    except Exception:
        return "/"


def jsonify(obj, status=200, headers=None, encoder=JSONEncoder):
    """Serialize to JSON and also dump from the given schema."""
    data = encoder().encode(obj)
    mimetype = "application/json"
    if "callback" in request.args:
        cb = request.args.get("callback")
        cb = "".join((c for c in cb if c in CALLBACK_VALID))
        data = "%s && %s(%s)" % (cb, cb, data)
        # mime cf. https://stackoverflow.com/questions/24528211/
        mimetype = "application/javascript"
    return Response(data, headers=headers, status=status, mimetype=mimetype)


def stream_ijson(iterable, encoder=JSONEncoder):
    """Stream JSON line-based data."""

    def _generate_stream():
        for row in iterable:
            row.pop("_index", None)
            yield encoder().encode(row)
            yield "\n"

    return Response(_generate_stream(), mimetype="application/json+stream")


def stream_csv(iterable):
    """Stream JSON line-based data."""

    def _generate_stream():
        for row in iterable:
            values = []
            for value in row:
                values.append(stringify(value) or "")
            buffer = io.StringIO()
            writer = csv.writer(buffer, dialect="excel", delimiter=",")
            writer.writerow(values)
            yield buffer.getvalue()

    return Response(_generate_stream(), mimetype="text_csv")


def render_xml(template, **kwargs):
    data = render_template(template, **kwargs)
    return Response(data, mimetype="text/xml")
