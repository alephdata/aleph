import logging

# from jinja2.filters import do_truncate as truncate
from jinja2.filters import do_striptags as striptags
from apikit.jsonify import JSONEncoder

from aleph.core import es, es_index
from aleph.model import EntityTag
from aleph.search.mapping import DOC_TYPE
from aleph.search.attributes import generate_attributes

log = logging.getLogger(__name__)
es.json_encoder = JSONEncoder


def html_summary(html):
    if not isinstance(html, unicode):
        html = html.decode('utf-8')
    # return truncate(striptags(html), length=250)
    return striptags(html)


def index_document(document):
    log.info("Indexing: %r", document)
    es.index(es_index, DOC_TYPE, body, package.id)
