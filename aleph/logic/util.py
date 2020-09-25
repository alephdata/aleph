import jwt
from werkzeug.urls import url_join
from urlnormalizer import query_string
from datetime import datetime, timedelta

from aleph.core import settings, url_for


def ui_url(resource, id=None, _relative=False, **query):
    """Make a UI link."""
    if id is not None:
        resource = "%s/%s" % (resource, id)
    url = "/" if _relative else settings.APP_UI_URL
    url = url_join(url, resource)
    return url + query_string(list(query.items()))


def collection_url(collection_id=None, **query):
    return ui_url("datasets", id=collection_id, **query)


def entityset_url(entityset_id=None, **query):
    return ui_url("sets", id=entityset_id, **query)


def entity_url(entity_id=None, **query):
    return ui_url("entities", id=entity_id, **query)


def archive_url(content_hash, file_name=None, mime_type=None, expire=None):
    """Create an access authorization link for an archive blob."""
    if content_hash is None:
        return None
    if expire is None:
        expire = datetime.utcnow() + timedelta(days=1)
    payload = {"c": content_hash, "f": file_name, "m": mime_type, "exp": expire}
    token = jwt.encode(payload, settings.SECRET_KEY)
    return url_for("archive_api.retrieve", _query=[("token", token)])
