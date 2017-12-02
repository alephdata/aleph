import logging

from aleph.core import es
from aleph.index.core import record_index
from aleph.index.core import entity_index
from aleph.index.core import collection_index
from aleph.index.mapping import RECORD_MAPPING
from aleph.index.mapping import ENTITY_MAPPING
from aleph.index.mapping import COLLECTION_MAPPING

log = logging.getLogger(__name__)


def upgrade_search():
    """Add any missing properties to the index mappings."""
    INDEXES = [
        (collection_index(), COLLECTION_MAPPING),
        (entity_index(), ENTITY_MAPPING),
        (record_index(), RECORD_MAPPING),
    ]
    for (index, mapping) in INDEXES:
        log.info("Creating index: %s", index)
        es.indices.create(index, ignore=[404, 400])
        es.indices.put_mapping(index=index, doc_type='doc', body=mapping)
        es.indices.open(index=index, ignore=[400, 404])
        es.indices.refresh(index=index)


def delete_index():
    es.indices.delete(collection_index(), ignore=[404, 400])
    es.indices.delete(entity_index(), ignore=[404, 400])
    es.indices.delete(record_index(), ignore=[404, 400])


def flush_index():
    """Run a refresh to apply all indexing changes."""
    es.indices.refresh(index=collection_index())
    es.indices.refresh(index=entity_index())
    es.indices.refresh(index=record_index())


def clear_index():
    indexes = [collection_index(), entity_index(), record_index()]
    q = {'query': {'match_all': {}}}
    es.delete_by_query(index=indexes, body=q, refresh=True)
