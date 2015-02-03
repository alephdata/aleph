import logging
from hashlib import sha1

from aleph.core import es, es_index
from aleph.views.util import AppEncoder
from aleph.model import EntityTag
from aleph.search.mapping import DOC_TYPE

from jinja2.filters import do_truncate as truncate
from jinja2.filters import do_striptags as striptags

log = logging.getLogger(__name__)
IGNORE = ['name', 'slug', 'title', 'source', 'source_url',
          'summary', 'created_at', 'updated_at', 'extension',
          'mime_type', 'text', 'normalized', 'entities',
          'http_status', 'http_headers', 'extract_article']


def html_summary(html):
    if not isinstance(html, unicode):
        html = html.decode('utf-8')
    return truncate(striptags(html), length=250)


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


def index_package(package, plain_text, normalized_text):
    es.json_encoder = AppEncoder
    body = {
        'id': package.id,
        'collection': package.collection
    }
    source = package.source
    if source is None:
        log.error("No source for package %r, skipping", package)
        return

    body['name'] = source.meta.get('name')
    body['slug'] = source.meta.get('slug')
    body['title'] = source.meta.get('title') or body['name']
    body['source'] = source.meta.get('source')
    body['source_url'] = source.meta.get('source_url')
    body['created_at'] = source.meta.get('created_at')
    body['updated_at'] = source.meta.get('updated_at')
    body['extension'] = source.meta.get('extension')
    body['mime_type'] = source.meta.get('mime_type')

    if plain_text.exists():
        body['text'] = plain_text.fh().read()
        body['summary'] = html_summary(body['text'])

    if normalized_text.exists():
        body['normalized'] = normalized_text.fh().read()

    if not body['title']:
        log.error("No title for package %r, skipping", package)
        return

    body['entities'] = EntityTag.by_package(package.collection, package.id)
    body['attributes'] = generate_attributes(source.meta)

    log.info("Indexing: %r", body['title'])
    es.index(es_index, DOC_TYPE, body, package.id)
