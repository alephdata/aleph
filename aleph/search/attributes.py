import logging
from hashlib import sha1

from aleph.core import es, es_index
from aleph.search.mapping import DOC_TYPE
from aleph.search.queries import attributes_query

CORE_ATTRIBUTES = {
    'name': False,
    'title': True,
    'source': True,
    'source_url': True,
    'summary': True,
    'extension': False,
    'mime_type': False
}

ALSO_IGNORE = ['slug', 'created_at', 'updated_at', 'text',
               'normalized', 'entities', 'http_status',
               'http_headers', 'extract_article']

IGNORE = CORE_ATTRIBUTES.keys() + ALSO_IGNORE

log = logging.getLogger(__name__)


def generate_attributes(meta):
    attributes = []
    for key, value in meta.items():
        if key in IGNORE or isinstance(value, (dict, list)):
            continue
        attributes.append({
            'id': sha1('%s:%r' % (key, value)).hexdigest(),
            'name': key,
            'value': unicode(value)
        })
    return attributes


def available_attributes(args, collections=None, lists=None):
    q = attributes_query(args, collections=collections, lists=lists)
    result = es.search(index=es_index, doc_type=DOC_TYPE, query=q)
    result = result.get('aggregations', {}).get('attributes', {})
    result = {r.get('key'): False for r in result.get('buckets', [])}
    return {'core': CORE_ATTRIBUTES, 'extra': result}
