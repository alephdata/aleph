from urlparse import urljoin

from aleph.core import app_ui_url
from aleph.text import query_string


def ui_url(resource, id=None, **query):
    """Make a UI link."""
    if id is not None:
        resource = '%s/%s' % (resource, id)
    query = query_string(query.items())
    return urljoin(app_ui_url, resource)
