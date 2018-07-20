import logging
from copy import deepcopy

from aleph.core import es
from aleph.index.core import record_index, entity_index
from aleph.index.core import collections_index, all_indexes
from aleph.index.mapping import RECORD_MAPPING
from aleph.index.mapping import ENTITY_MAPPING
from aleph.index.mapping import COLLECTION_MAPPING
from aleph.index.mapping import INDEX_SETTINGS

log = logging.getLogger(__name__)


def upgrade_search():
    """Add any missing properties to the index mappings."""
    INDEXES = [
        (collections_index(), COLLECTION_MAPPING),
        (entity_index(), ENTITY_MAPPING),
        (record_index(), RECORD_MAPPING),
    ]
    for (index, mapping) in INDEXES:
        log.info("Creating index: %s", index)
        settings = deepcopy(INDEX_SETTINGS)
        if index == record_index():
            # optimise records for bulk write
            settings['index']['refresh_interval'] = '-1'
        body = {
            'settings': settings,
            'mappings': {'doc': mapping}
        }
        es.indices.create(index, body=body, ignore=[404, 400])
        # es.indices.put_mapping(index=index, doc_type='doc', body=mapping)
        es.indices.open(index=index, ignore=[400, 404])
        es.indices.refresh(index=index, ignore=[400, 404])
        es.indices.clear_cache(index=index, ignore=[400, 404])


def delete_index():
    es.indices.delete(index=all_indexes(), ignore=[404, 400])


def clear_index():
    q = {'query': {'match_all': {}}}
    es.delete_by_query(index=all_indexes(), body=q, refresh=True)
