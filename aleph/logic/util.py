import jwt
from werkzeug.urls import url_join
from urlnormalizer import query_string

from aleph.core import settings, url_for


def ui_url(resource, id=None, _relative=False, **query):
    """Make a UI link."""
    if id is not None:
        resource = '%s/%s' % (resource, id)
    url = '/' if _relative else settings.APP_UI_URL
    url = url_join(url, resource)
    return url + query_string(list(query.items()))


def collection_url(collection_id=None, **query):
    return ui_url('datasets', id=collection_id, **query)


def diagram_url(diagram_id=None, **query):
    return ui_url('diagrams', id=diagram_id, **query)


def entity_url(entity_id=None, **query):
    return ui_url('entities', id=entity_id, **query)


def archive_url(role_id, content_hash, file_name=None, mime_type=None):
    """Create an access authorization link for an archive blob."""
    if content_hash is None:
        return None
    payload = dict(r=role_id, h=content_hash, f=file_name, t=mime_type)
    claim = jwt.encode(payload, settings.SECRET_KEY).decode('utf-8')
    return url_for('archive_api.retrieve', _authorize=True,
                   _query=[('claim', claim)])


def archive_claim(claim):
    """Unpack an access authorization token for an archive blob."""
    data = jwt.decode(claim, key=settings.SECRET_KEY, verify=True)
    return data.get('r'), data.get('h'), data.get('f'), data.get('t')
