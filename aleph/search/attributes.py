import logging

from aleph.core import es, es_index
from aleph.index.mapping import TYPE_DOCUMENT

CORE_FIELDS = {
    'name': False,
    'title': True,
    'collection': True,
    'source_url': True,
    'summary': True,
    'extension': False,
    'mime_type': False,
    'entities': False
}

ALSO_IGNORE = ['slug', 'created_at', 'updated_at', 'text',
               'normalized', 'http_status',
               'http_headers', 'extract_article']

IGNORE = CORE_FIELDS.keys() + ALSO_IGNORE

log = logging.getLogger(__name__)


def available_attributes(args, sources=None, lists=None):
    return {'fields': CORE_FIELDS}
