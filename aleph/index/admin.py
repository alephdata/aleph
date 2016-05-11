import logging

from aleph.core import get_es, get_es_index
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD, TYPE_ENTITY
from aleph.index.mapping import DOCUMENT_MAPPING, RECORD_MAPPING
from aleph.index.mapping import ENTITY_MAPPING

log = logging.getLogger(__name__)


def init_search():
    log.info("Creating ElasticSearch index and uploading mapping...")
    get_es().indices.create(get_es_index(), body={
        'mappings': {
            TYPE_DOCUMENT: DOCUMENT_MAPPING,
            TYPE_RECORD: RECORD_MAPPING,
            TYPE_ENTITY: ENTITY_MAPPING
        }
    })
    get_es().indices.open(index=get_es_index())


def upgrade_search():
    """Add any missing properties to the index mappings."""
    get_es().indices.put_mapping(index=get_es_index(), body=DOCUMENT_MAPPING,
                                 doc_type=TYPE_DOCUMENT)
    get_es().indices.put_mapping(index=get_es_index(), body=RECORD_MAPPING,
                                 doc_type=TYPE_RECORD)
    get_es().indices.put_mapping(index=get_es_index(), body=ENTITY_MAPPING,
                                 doc_type=TYPE_ENTITY)


def optimize_search():
    get_es().indices.optimize(index=get_es_index())


def delete_index():
    get_es().indices.delete(get_es_index(), ignore=[404])
