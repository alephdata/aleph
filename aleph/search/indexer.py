from aleph.core import es, es_index
from aleph.util import AppEncoder
from aleph.search.mapping import DOC_TYPE


def index_package(package):
    es.json_encoder = AppEncoder
    body = {
        'id': package.id
    }
    es.index(es_index, DOC_TYPE, body, package.id)

