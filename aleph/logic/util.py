from urlparse import urljoin
from urlnormalizer import query_string

from aleph.core import app_ui_url


def ui_url(resource, id=None, **query):
    """Make a UI link."""
    if id is not None:
        resource = '%s/%s' % (resource, id)
    url = urljoin(app_ui_url, resource)
    return url + query_string(query.items())
