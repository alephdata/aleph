import logging

from aleph.core import es, es_index
from aleph.index.mapping import TYPE_DOCUMENT, TYPE_RECORD
from aleph.index.mapping import TYPE_ENTITY, TYPE_LINK
from aleph.index.mapping import DOCUMENT_MAPPING, RECORD_MAPPING
from aleph.index.mapping import ENTITY_MAPPING, LINK_MAPPING

log = logging.getLogger(__name__)


def init_search():
    log.info("Creating ElasticSearch index and uploading mapping...")
    es.indices.create(es_index, body={
        'mappings': {
            TYPE_DOCUMENT: DOCUMENT_MAPPING,
            TYPE_RECORD: RECORD_MAPPING,
            TYPE_ENTITY: ENTITY_MAPPING,
            TYPE_LINK: LINK_MAPPING
        }
    }, ignore=[404])
    es.indices.open(index=es_index, ignore=[400, 404])


def upgrade_search():
    """Add any missing properties to the index mappings."""
    es.indices.put_mapping(index=es_index, body=DOCUMENT_MAPPING,
                           doc_type=TYPE_DOCUMENT)
    es.indices.put_mapping(index=es_index, body=RECORD_MAPPING,
                           doc_type=TYPE_RECORD)
    es.indices.put_mapping(index=es_index, body=ENTITY_MAPPING,
                           doc_type=TYPE_ENTITY)
    es.indices.put_mapping(index=es_index, body=LINK_MAPPING,
                           doc_type=TYPE_LINK)


def delete_index():
    es.indices.delete(es_index, ignore=[404, 400])


def flush_index():
    """Run a refresh to apply all indexing changes."""
    es.indices.refresh(index=es_index)
