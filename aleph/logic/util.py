from urllib.parse import urljoin
from urlnormalizer import query_string

from aleph.core import settings


def ui_url(resource, id=None, **query):
    """Make a UI link."""
    if id is not None:
        resource = '%s/%s' % (resource, id)
    url = urljoin(settings.APP_UI_URL, resource)
    return url + query_string(list(query.items()))


def collection_url(collection_id=None, **query):
    return ui_url('collections', id=collection_id, **query)


def entity_url(entity_id=None, **query):
    return ui_url('entities', id=entity_id, **query)


def document_url(document_id=None, **query):
    return ui_url('documents', id=document_id, **query)
