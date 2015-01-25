from aleph.core import es, es_index
from aleph.views.util import AppEncoder
from aleph.search.mapping import DOC_TYPE


def index_package(package, plain_text, normalized_text):
    es.json_encoder = AppEncoder
    body = {
        'id': package.id
    }
    es.index(es_index, DOC_TYPE, body, package.id)

